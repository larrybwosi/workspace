import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { prisma } from '@repo/database';
import * as crypto from 'crypto';

@Injectable()
export class ProvisioningService {
  async provisionWorkspace(context: any, data: any) {
    return await prisma
      .$transaction(async tx => {
        // Check if slug exists
        const existing = await tx.workspace.findUnique({ where: { slug: data.slug } });
        if (existing) {
          throw new BadRequestException(`Workspace slug "${data.slug}" is already taken. Please choose a unique slug.`);
        }

        // Find owner
        const owner = await tx.user.findUnique({ where: { email: data.ownerEmail } });
        if (!owner) {
          throw new BadRequestException(`Owner user with email "${data.ownerEmail}" not found. Please ensure the user exists in your organization before provisioning.`);
        }

        // If M2M, verify owner belongs to organization
        if (context.organizationId) {
          const isMember = await tx.member.findFirst({
            where: {
              organizationId: context.organizationId,
              userId: owner.id,
            },
          });
          if (!isMember) {
            throw new BadRequestException('Workspace owner must be a member of your organization');
          }
        }

        // 1. Create Workspace
        const workspace = await tx.workspace.create({
          data: {
            name: data.name,
            slug: data.slug,
            ownerId: owner.id,
            organizationId: context.organizationId,
            industry: data.industry,
            description: data.description,
            icon: data.icon || 'building',
            brandingConfig: data.brandingConfig,
            members: {
              create: {
                userId: owner.id,
                role: 'owner',
              },
            },
          },
        });

        // 2. Create Channels
        if (data.channels && data.channels.length > 0) {
          for (const channelName of data.channels) {
            await tx.channel.create({
              data: {
                workspaceId: workspace.id,
                name: channelName,
                icon: 'hash',
                type: 'channel',
                createdById: owner.id,
              },
            });
          }
        }

        // 3. Add initial members
        if (data.initialMembers && data.initialMembers.length > 0) {
          for (const member of data.initialMembers) {
            const user = await tx.user.findUnique({ where: { email: member.email } });
            if (user) {
              // Verify member belongs to organization if M2M
              if (context.organizationId) {
                const isOrgMember = await tx.member.findFirst({
                  where: { organizationId: context.organizationId, userId: user.id },
                });
                if (!isOrgMember) continue;
              }

              await tx.workspaceMember.upsert({
                where: {
                  workspaceId_userId: {
                    workspaceId: workspace.id,
                    userId: user.id,
                  },
                },
                update: { role: member.role },
                create: {
                  workspaceId: workspace.id,
                  userId: user.id,
                  role: member.role,
                },
              });
            }
          }
        }

        // 4. If M2M, Install the provisioning app into the new workspace
        if (context.m2mClientId) {
          const app = await tx.botApplication.findUnique({
            where: { clientId: context.m2mClientId },
          });

          if (app && app.botId) {
            await tx.workspaceMember.create({
              data: {
                workspaceId: workspace.id,
                userId: app.botId,
                role: 'admin', // M2M apps are admins by default in provisioned workspaces
              },
            });
          }
        }

        // 5. Create Default Bot (System Bot)
        const botId = `bot_${crypto.randomBytes(8).toString('hex')}`;
        const botUser = await tx.user.create({
          data: {
            id: botId,
            name: `System Bot`,
            email: `${workspace.slug}-bot@system.internal`,
            isBot: true,
            status: 'online',
          },
        });

        const clientId = `bot_${crypto.randomBytes(16).toString('hex')}`;
        const clientSecret = crypto.randomBytes(32).toString('hex');

        const botApp = await tx.botApplication.create({
          data: {
            name: `System Bot`,
            description: `Default system bot for ${workspace.name}. Responsible for announcements and general info.`,
            clientId,
            clientSecret,
            ownerId: owner.id,
            botId: botUser.id,
            workspaceId: workspace.id,
          },
        });

        // Add bot to workspace members as an admin to ensure it can post system-wide
        await tx.workspaceMember.create({
          data: {
            workspaceId: workspace.id,
            userId: botUser.id,
            role: 'admin',
          },
        });

        // 6. Audit Log
        await tx.workspaceAuditLog.create({
          data: {
            workspaceId: workspace.id,
            userId: context.userId,
            action: 'workspace.provisioned',
            resource: 'workspace',
            resourceId: workspace.id,
            metadata: { provisioner: context.clientId } as any,
          },
        });

        return {
          success: true,
          workspace: {
            id: workspace.id,
            slug: workspace.slug,
            name: workspace.name,
          },
          bot: {
            id: botApp.id,
            clientId: botApp.clientId,
            clientSecret: botApp.clientSecret,
          },
        };
      })
      .catch(err => {
        if (err instanceof BadRequestException) throw err;
        console.error('Provisioning failed:', err);
        throw new InternalServerErrorException('Failed to provision workspace');
      });
  }
}

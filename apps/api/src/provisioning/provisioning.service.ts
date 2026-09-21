import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { prisma } from '@repo/database';
import * as crypto from 'crypto';

@Injectable()
export class ProvisioningService {
  private readonly logger = new Logger(ProvisioningService.name);
  async provisionWorkspace(context: any, data: any) {
    return await prisma
      .$transaction(async tx => {
        // Check if slug exists
        const existing = await tx.workspace.findUnique({ where: { slug: data.slug } });
        if (existing) {
          throw new BadRequestException(`Workspace slug "${data.slug}" is already taken. Please choose a unique slug.`);
        }

        // Find or create owner
        let owner = await tx.user.findUnique({ where: { email: data.ownerEmail } });
        if (!owner) {
          const name = data.ownerName || data.ownerEmail.split('@')[0] || data.ownerEmail;
          owner = await tx.user.create({
            data: {
              email: data.ownerEmail,
              name,
              ...(data.ownerAvatar ? { avatar: data.ownerAvatar } : {}),
            },
          });
        } else if (data.ownerName || data.ownerAvatar) {
          owner = await tx.user.update({
            where: { id: owner.id },
            data: {
              ...(data.ownerName ? { name: data.ownerName } : {}),
              ...(data.ownerAvatar ? { avatar: data.ownerAvatar } : {}),
            },
          });
        }

        // If M2M, verify owner belongs to organization
        if (context.organizationId) {
          const org = await tx.organization.findUnique({
            where: { id: context.organizationId },
            select: {
              members: {
                where: { userId: owner.id },
                select: { id: true },
              },
            },
          });
          const isMember = org && org.members.length > 0;
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
          await tx.channel.createMany({
            data: data.channels.map((channelName: string) => ({
              workspaceId: workspace.id,
              name: channelName,
              icon: 'hash',
              type: 'channel',
              createdById: owner.id,
            })),
          });
        }

        // 3. Add initial members
        if (data.initialMembers && data.initialMembers.length > 0) {
          for (const member of data.initialMembers) {
            let user = await tx.user.findUnique({ where: { email: member.email } });
            if (!user) {
              const name = member.name || member.email.split('@')[0] || member.email;
              user = await tx.user.create({
                data: {
                  email: member.email,
                  name,
                  ...(member.avatar ? { avatar: member.avatar } : {}),
                },
              });
            } else if (member.name || member.avatar) {
              user = await tx.user.update({
                where: { id: user.id },
                data: {
                  ...(member.name ? { name: member.name } : {}),
                  ...(member.avatar ? { avatar: member.avatar } : {}),
                },
              });
            }

            if (user) {
              // Ensure member belongs to organization if M2M context exists
              if (context.organizationId) {
                const org = await tx.organization.findUnique({
                  where: { id: context.organizationId },
                  select: {
                    members: {
                      where: { userId: user.id },
                      select: { id: true },
                    },
                  },
                });
                const isOrgMember = org && org.members.length > 0;
                if (!isOrgMember && tx.member) {
                  await tx.member.create({
                    data: {
                      organizationId: context.organizationId,
                      userId: user.id,
                      role: 'member',
                    },
                  });
                }
              }

              await tx.workspaceMember.upsert({
                where: {
                  workspaceId_userId: {
                    workspaceId: workspace.id,
                    userId: user.id,
                  },
                },
                update: { role: member.role || 'member' },
                create: {
                  workspaceId: workspace.id,
                  userId: user.id,
                  role: member.role || 'member',
                },
              });
            }
          }
        }

        // 4. Create Default Bot (System Bot)
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

        // 5. Audit Log
        await tx.workspaceAuditLog.create({
          data: {
            workspaceId: workspace.id,
            userId: context.userId || owner.id,
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
        this.logger.error('Provisioning failed:', err?.stack || err);
        throw new InternalServerErrorException('Failed to provision workspace');
      });
  }
}

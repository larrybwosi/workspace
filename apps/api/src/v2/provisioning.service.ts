import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { prisma } from '@repo/database';

@Injectable()
export class ProvisioningService {
  async provisionWorkspace(context: any, data: any) {
    return await prisma.$transaction(async (tx) => {
      // Check if slug exists
      const existing = await tx.workspace.findUnique({ where: { slug: data.slug } });
      if (existing) {
        throw new BadRequestException('Workspace slug already taken');
      }

      // Find owner
      const owner = await tx.user.findUnique({ where: { email: data.ownerEmail } });
      if (!owner) {
        throw new BadRequestException('Owner user not found');
      }

      // 1. Create Workspace
      const workspace = await tx.workspace.create({
        data: {
          name: data.name,
          slug: data.slug,
          ownerId: owner.id,
          industry: data.industry,
          description: data.description,
          icon: data.icon || 'building',
          brandingConfig: data.brandingConfig,
          members: {
            create: {
              userId: owner.id,
              role: 'owner',
            }
          }
        }
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
            }
          });
        }
      }

      // 3. Add initial members
      if (data.initialMembers && data.initialMembers.length > 0) {
        for (const member of data.initialMembers) {
          const user = await tx.user.findUnique({ where: { email: member.email } });
          if (user) {
            await tx.workspaceMember.upsert({
              where: {
                workspaceId_userId: {
                  workspaceId: workspace.id,
                  userId: user.id
                }
              },
              update: { role: member.role },
              create: {
                workspaceId: workspace.id,
                userId: user.id,
                role: member.role
              }
            });
          }
        }
      }

      // 4. Audit Log
      await tx.workspaceAuditLog.create({
        data: {
          workspaceId: workspace.id,
          userId: context.userId,
          action: 'workspace.provisioned',
          resource: 'workspace',
          resourceId: workspace.id,
          metadata: { provisioner: context.clientId } as any,
        }
      });

      return {
        success: true,
        workspace: {
          id: workspace.id,
          slug: workspace.slug,
          name: workspace.name
        }
      };
    }).catch(err => {
      if (err instanceof BadRequestException) throw err;
      console.error('Provisioning failed:', err);
      throw new InternalServerErrorException('Failed to provision workspace');
    });
  }
}

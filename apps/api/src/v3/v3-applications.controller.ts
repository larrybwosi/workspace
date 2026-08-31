import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UseFilters,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ApiV3Guard, ApiV3Context } from '../auth/api-v3.guard';
import { V3Context } from '../auth/v3-context.decorator';
import { V3ExceptionFilter } from './v3-exception.filter';
import { prisma } from '@repo/database';
import * as crypto from 'crypto';

function generateBotToken(userId: string): string {
  const base64Id = Buffer.from(userId).toString('base64');
  const timestamp = Date.now().toString();
  const secret = process.env.BOT_TOKEN_SECRET || 'change-me-to-a-random-secret';
  const signature = crypto.createHmac('sha256', secret).update(`${base64Id}.${timestamp}`).digest('base64url');
  return `${base64Id}.${timestamp}.${signature}`;
}

@ApiTags('V3 Bot Applications')
@ApiBearerAuth()
@Controller()
@UseGuards(ApiV3Guard)
@UseFilters(V3ExceptionFilter)
export class V3ApplicationsController {
  private async checkAppAccess(app: any, context: ApiV3Context) {
    if (context.organizationId) {
      if (app.ownerId === context.userId) return;
      if (app.workspaceId) {
        const ws = await prisma.workspace.findUnique({
          where: { id: app.workspaceId },
          select: { organizationId: true },
        });
        if (ws?.organizationId === context.organizationId) return;
      }
      throw new ForbiddenException('Forbidden');
    } else {
      if (app.ownerId !== context.userId) {
        throw new ForbiddenException('Forbidden');
      }
    }
  }

  /**
   * List applications owned by user or organization
   */
  @Get(['v3/applications', 'v2/applications'])
  @ApiOperation({ summary: 'List bot applications' })
  async listApplications(@V3Context() context: ApiV3Context) {
    const whereCondition = context.organizationId
      ? {
          OR: [
            { ownerId: context.userId },
            { workspace: { organizationId: context.organizationId } },
          ],
        }
      : { ownerId: context.userId };

    const apps = await prisma.botApplication.findMany({
      where: whereCondition,
      include: {
        bot: {
          select: {
            id: true,
            name: true,
            avatar: true,
            botToken: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return apps.map(app => ({
      id: app.id,
      name: app.name,
      description: app.description,
      clientId: app.clientId,
      clientSecret: app.clientSecret,
      interactionsUrl: app.interactionsUrl,
      channelDefinitions: app.channelDefinitions,
      workspaceId: app.workspaceId,
      ownerId: app.ownerId,
      bot: app.bot
        ? {
            id: app.bot.id,
            name: app.bot.name,
            avatar: app.bot.avatar,
            botToken: app.bot.botToken,
          }
        : undefined,
      createdAt: app.createdAt,
    }));
  }

  /**
   * Create a new Bot Application
   */
  @Post(['v3/applications', 'v2/applications'])
  @ApiOperation({ summary: 'Create a bot application' })
  async createApplication(
    @V3Context() context: ApiV3Context,
    @Body()
    body: {
      name: string;
      description?: string;
      workspaceId?: string;
      workspaceSlug?: string;
      channelDefinitions?: any;
      interactionsUrl?: string;
    }
  ) {
    if (!body.name) {
      throw new BadRequestException('Application name is required');
    }

    const botId = `bot_${crypto.randomBytes(8).toString('hex')}`;
    const botToken = generateBotToken(botId);

    const botUser = await prisma.user.create({
      data: {
        id: botId,
        name: body.name,
        email: `bot-${botId}@system.internal`,
        isBot: true,
        botToken,
        status: 'online',
      },
    });

    const clientId = `app_${crypto.randomBytes(12).toString('hex')}`;
    const clientSecret = crypto.randomBytes(32).toString('hex');

    // Resolve target workspace if provided
    let targetWorkspaceId: string | null = null;
    let targetOwnerId = context.userId;

    if (body.workspaceId || body.workspaceSlug) {
      const workspace = await prisma.workspace.findFirst({
        where: {
          OR: [{ id: body.workspaceId }, { slug: body.workspaceSlug }],
        },
        select: { id: true, ownerId: true },
      });
      if (workspace) {
        targetWorkspaceId = workspace.id;
        if (context.organizationId) {
          targetOwnerId = workspace.ownerId;
        }
      }
    }

    // If targetOwnerId is not a valid user in database (e.g. M2M subject 'm2m:...'), find org owner
    if (context.organizationId) {
      const dbOwner = await prisma.user.findUnique({ where: { id: targetOwnerId } });
      if (!dbOwner) {
        const orgWithMember = await prisma.organization.findUnique({
          where: { id: context.organizationId },
          select: {
            members: {
              select: { userId: true },
              take: 1,
            },
          },
        });
        const orgMember = orgWithMember?.members[0];
        if (orgMember) {
          targetOwnerId = orgMember.userId;
        }
      }
    }

    const app = await prisma.botApplication.create({
      data: {
        name: body.name,
        description: body.description,
        clientId,
        clientSecret,
        ownerId: targetOwnerId,
        botId: botUser.id,
        workspaceId: targetWorkspaceId,
        interactionsUrl: body.interactionsUrl,
        channelDefinitions: body.channelDefinitions || null,
      },
      include: {
        bot: true,
      },
    });

    // If installed to a workspace, add bot as member & provision channels
    if (targetWorkspaceId) {
      await this.installBotToWorkspace(app.id, targetWorkspaceId, targetOwnerId);
    }

    return {
      id: app.id,
      name: app.name,
      description: app.description,
      clientId: app.clientId,
      clientSecret: app.clientSecret,
      interactionsUrl: app.interactionsUrl,
      channelDefinitions: app.channelDefinitions,
      workspaceId: app.workspaceId,
      ownerId: app.ownerId,
      bot: {
        id: botUser.id,
        name: botUser.name,
        avatar: botUser.avatar,
        botToken: botUser.botToken,
      },
      createdAt: app.createdAt,
    };
  }

  /**
   * Get application details
   */
  @Get(['v3/applications/:id', 'v2/applications/:id'])
  @ApiOperation({ summary: 'Get application details' })
  @ApiParam({ name: 'id', description: 'Application ID' })
  async getApplication(@V3Context() context: ApiV3Context, @Param('id') id: string) {
    const app = await prisma.botApplication.findUnique({
      where: { id },
      include: {
        bot: true,
      },
    });

    if (!app) {
      throw new NotFoundException('Application not found');
    }

    await this.checkAppAccess(app, context);

    return {
      id: app.id,
      name: app.name,
      description: app.description,
      clientId: app.clientId,
      clientSecret: app.clientSecret,
      interactionsUrl: app.interactionsUrl,
      channelDefinitions: app.channelDefinitions,
      workspaceId: app.workspaceId,
      ownerId: app.ownerId,
      bot: app.bot
        ? {
            id: app.bot.id,
            name: app.bot.name,
            avatar: app.bot.avatar,
            botToken: app.bot.botToken,
          }
        : undefined,
      createdAt: app.createdAt,
    };
  }

  /**
   * Update application details
   */
  @Patch('v3/applications/:id')
  @Post(['v3/applications/:id', 'v2/applications/:id'])
  @ApiOperation({ summary: 'Update bot application' })
  @ApiParam({ name: 'id', description: 'Application ID' })
  async updateApplication(
    @V3Context() context: ApiV3Context,
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string; channelDefinitions?: any; interactionsUrl?: string }
  ) {
    const app = await prisma.botApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException('Application not found');
    await this.checkAppAccess(app, context);

    const updated = await prisma.botApplication.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.interactionsUrl !== undefined && { interactionsUrl: body.interactionsUrl }),
        ...(body.channelDefinitions !== undefined && { channelDefinitions: body.channelDefinitions }),
      },
      include: { bot: true },
    });

    if (body.name && updated.botId) {
      await prisma.user.update({
        where: { id: updated.botId },
        data: { name: body.name },
      });
    }

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      clientId: updated.clientId,
      clientSecret: updated.clientSecret,
      interactionsUrl: updated.interactionsUrl,
      channelDefinitions: updated.channelDefinitions,
      workspaceId: updated.workspaceId,
      ownerId: updated.ownerId,
      bot: updated.bot
        ? {
            id: updated.bot.id,
            name: updated.bot.name,
            avatar: updated.bot.avatar,
            botToken: updated.bot.botToken,
          }
        : undefined,
    };
  }

  /**
   * Reset Bot Token
   */
  @Post(['v3/applications/:id/reset-token', 'v2/applications/:id/reset-token'])
  @ApiOperation({ summary: 'Reset bot token' })
  @ApiParam({ name: 'id', description: 'Application ID' })
  async resetToken(@V3Context() context: ApiV3Context, @Param('id') id: string) {
    const app = await prisma.botApplication.findUnique({
      where: { id },
      include: { bot: true },
    });

    if (!app) throw new NotFoundException('Application not found');
    await this.checkAppAccess(app, context);
    if (!app.botId) throw new BadRequestException('Bot user not associated with application');

    const newToken = generateBotToken(app.botId);

    const updatedBot = await prisma.user.update({
      where: { id: app.botId },
      data: { botToken: newToken },
    });

    return {
      id: app.id,
      botToken: updatedBot.botToken,
      bot: {
        id: updatedBot.id,
        name: updatedBot.name,
        botToken: updatedBot.botToken,
      },
    };
  }

  /**
   * Delete application
   */
  @Delete('v3/applications/:id')
  @Post(['v3/applications/:id/delete', 'v2/applications/:id/delete'])
  @ApiOperation({ summary: 'Delete bot application' })
  @ApiParam({ name: 'id', description: 'Application ID' })
  async deleteApplication(@V3Context() context: ApiV3Context, @Param('id') id: string) {
    const app = await prisma.botApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException('Application not found');
    await this.checkAppAccess(app, context);

    await prisma.botApplication.delete({ where: { id } });
    if (app.botId) {
      await prisma.user.delete({ where: { id: app.botId } }).catch(() => {});
    }

    return { success: true };
  }

  /**
   * Install bot application into a workspace
   */
  @Post(['v3/applications/:id/install', 'v2/applications/:id/install'])
  @ApiOperation({ summary: 'Install bot application to a workspace' })
  @ApiParam({ name: 'id', description: 'Application ID' })
  async installApplication(
    @V3Context() context: ApiV3Context,
    @Param('id') id: string,
    @Body() body: { workspaceId?: string; workspaceSlug?: string }
  ) {
    const workspaceIdOrSlug = body.workspaceId || body.workspaceSlug;
    if (!workspaceIdOrSlug) {
      throw new BadRequestException('workspaceId or workspaceSlug is required');
    }

    const workspace = await prisma.workspace.findFirst({
      where: {
        OR: [{ id: workspaceIdOrSlug }, { slug: workspaceIdOrSlug }],
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return this.installBotToWorkspace(id, workspace.id, workspace.ownerId || context.userId);
  }

  /**
   * Workspace bot management: List installed bots in workspace
   */
  @Get('v3/workspaces/:slug/bots')
  @ApiOperation({ summary: 'List installed bots in workspace' })
  @ApiParam({ name: 'slug', description: 'Workspace slug' })
  async listWorkspaceBots(@V3Context() context: ApiV3Context, @Param('slug') slug: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      select: {
        id: true,
        members: {
          where: { user: { isBot: true } },
          select: {
            id: true,
            role: true,
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                isBot: true,
                botApplication: {
                  select: {
                    id: true,
                    description: true,
                    clientId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!workspace) throw new NotFoundException('Workspace not found');

    return workspace.members.map(m => ({
      id: m.user.id,
      name: m.user.name,
      avatar: m.user.avatar,
      role: m.role,
      application: m.user.botApplication,
    }));
  }

  /**
   * Workspace bot management: Install existing bot to workspace
   */
  @Post('v3/workspaces/:slug/bots')
  @ApiOperation({ summary: 'Add a bot to a workspace' })
  @ApiParam({ name: 'slug', description: 'Workspace slug' })
  async addBotToWorkspace(@V3Context() context: ApiV3Context, @Param('slug') slug: string, @Body() body: { applicationId: string }) {
    if (!body.applicationId) throw new BadRequestException('applicationId is required');
    const workspace = await prisma.workspace.findUnique({ where: { slug } });
    if (!workspace) throw new NotFoundException('Workspace not found');

    return this.installBotToWorkspace(body.applicationId, workspace.id, workspace.ownerId || context.userId);
  }

  /**
   * Helper function to perform bot installation into a workspace
   */
  private async installBotToWorkspace(applicationId: string, workspaceId: string, userId: string) {
    const app = await prisma.botApplication.findUnique({
      where: { id: applicationId },
      include: { bot: true },
    });

    if (!app || !app.bot) {
      throw new NotFoundException('Bot Application or Bot User not found');
    }

    // Add bot as WorkspaceMember
    await prisma.workspaceMember.upsert({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: app.bot.id,
        },
      },
      update: { role: 'admin' },
      create: {
        workspaceId,
        userId: app.bot.id,
        role: 'admin',
      },
    });

    // Update application's primary workspace if null
    if (!app.workspaceId) {
      await prisma.botApplication.update({
        where: { id: app.id },
        data: { workspaceId },
      });
    }

    // Provision channel definitions if specified
    const channelDefs = app.channelDefinitions as any[];
    if (Array.isArray(channelDefs) && channelDefs.length > 0) {
      for (const def of channelDefs) {
        if (!def.channelName) continue;

        let teamId: string | null = null;
        if (def.teamName) {
          let team = await prisma.workspaceTeam.findFirst({
            where: { workspaceId, name: def.teamName },
          });
          if (!team) {
            const teamSlug = def.teamName.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
            team = await prisma.workspaceTeam.create({
              data: {
                workspaceId,
                name: def.teamName,
                slug: `${teamSlug}-${crypto.randomBytes(3).toString('hex')}`,
                description: def.teamDescription || `Managed by ${app.name}`,
                appId: app.id,
                leadId: app.bot.id,
              },
            });
          }
          teamId = team.id;
        }

        let channel = await prisma.channel.findFirst({
          where: { workspaceId, name: def.channelName },
        });

        if (!channel) {
          const channelSlug = def.channelName.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
          channel = await prisma.channel.create({
            data: {
              workspaceId,
              name: def.channelName,
              slug: channelSlug,
              description: def.teamDescription || `Channel managed by ${app.name}`,
              type: 'channel',
              icon: def.icon || 'hash',
              appId: app.id,
            },
          });
        }

        // Add bot to channel membership
        await prisma.channelMember.upsert({
          where: {
            channelId_userId: {
              channelId: channel.id,
              userId: app.bot.id,
            },
          },
          update: {},
          create: {
            channelId: channel.id,
            userId: app.bot.id,
          },
        });

        // Auto populate workspace members with matching roles into channel/team
        if (Array.isArray(def.autoPopulateRoles) && def.autoPopulateRoles.length > 0) {
          const matchingMembers = await prisma.workspaceMember.findMany({
            where: {
              workspaceId,
              role: { in: def.autoPopulateRoles },
            },
            select: { userId: true },
          });

          for (const member of matchingMembers) {
            await prisma.channelMember.upsert({
              where: {
                channelId_userId: {
                  channelId: channel.id,
                  userId: member.userId,
                },
              },
              update: {},
              create: {
                channelId: channel.id,
                userId: member.userId,
              },
            });
          }
        }
      }
    }

    return {
      success: true,
      workspaceId,
      applicationId: app.id,
      botId: app.bot.id,
    };
  }
}

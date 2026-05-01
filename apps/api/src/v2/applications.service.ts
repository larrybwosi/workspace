import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { prisma } from '@repo/database';
import * as crypto from 'crypto';

@Injectable()
export class V2ApplicationsService {
  async createApplication(ownerId: string, data: { name: string; description?: string }) {
    const clientId = crypto.randomBytes(8).toString('hex');
    const clientSecret = crypto.randomBytes(32).toString('hex');
    const verifyKey = crypto.randomBytes(32).toString('hex');

    // Create the bot user first
    const botUser = await prisma.user.create({
      data: {
        name: data.name,
        username: `bot_${clientId}`,
        email: `${clientId}@bot.local`,
        isBot: true,
        role: 'bot',
      },
    });

    const botToken = this.generateBotToken(botUser.id);

    await prisma.user.update({
      where: { id: botUser.id },
      data: { botToken },
    });

    const application = await prisma.botApplication.create({
      data: {
        name: data.name,
        description: data.description,
        clientId,
        clientSecret,
        verifyKey,
        ownerId,
        botId: botUser.id,
      },
      include: {
        bot: true,
      },
    });

    return {
      ...application,
      bot: {
        ...application.bot,
        token: botToken,
      },
    };
  }

  async getApplications(ownerId: string) {
    return prisma.botApplication.findMany({
      where: { ownerId },
      include: { bot: true },
    });
  }

  async getApplication(ownerId: string, id: string) {
    const app = await prisma.botApplication.findUnique({
      where: { id },
      include: { bot: true },
    });

    if (!app) throw new NotFoundException('Application not found');
    if (app.ownerId !== ownerId) throw new ForbiddenException('Not your application');

    return app;
  }

  async updateApplication(ownerId: string, id: string, data: { name?: string; description?: string; channelDefinitions?: any }) {
    const app = await this.getApplication(ownerId, id);

    return prisma.botApplication.update({
      where: { id: app.id },
      data,
      include: { bot: true },
    });
  }

  async deleteApplication(ownerId: string, id: string) {
    const app = await this.getApplication(ownerId, id);

    // Delete the bot user if it exists
    if (app.botId) {
      await prisma.user.delete({ where: { id: app.botId } });
    }

    return prisma.botApplication.delete({ where: { id: app.id } });
  }

  async resetBotToken(ownerId: string, id: string) {
    const app = await this.getApplication(ownerId, id);
    if (!app.botId) throw new NotFoundException('Bot not found for this application');

    const newToken = this.generateBotToken(app.botId);

    await prisma.user.update({
      where: { id: app.botId },
      data: { botToken: newToken },
    });

    return { token: newToken };
  }

  async installBot(userId: string, applicationId: string, workspaceId: string) {
    const app = await prisma.botApplication.findUnique({
      where: { id: applicationId },
      include: { bot: true },
    });

    if (!app || !app.botId) throw new NotFoundException('Application or Bot not found');

    // Check if bot is global or user is owner
    if (!app.isGlobal && app.ownerId !== userId) {
      throw new ForbiddenException('This bot is private and you are not the owner');
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: { where: { userId } } },
    });

    if (!workspace) throw new NotFoundException('Workspace not found');

    // Check if user has permission to add bots (require MANAGE_GUILD or ADMINISTRATOR)
    const member = workspace.members[0];
    if (!member) throw new ForbiddenException('Not a member of this workspace');

    const perms = BigInt(member.permissions);
    const canManageGuild = (perms & (1n << 3n)) === (1n << 3n) || (perms & (1n << 5n)) === (1n << 5n);

    if (member.role !== 'owner' && !canManageGuild) {
      throw new ForbiddenException('Missing MANAGE_GUILD permission');
    }

    // Check if bot already in workspace
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: app.botId,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException('Bot is already in this workspace');
    }

    const member_result = await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: app.botId,
        role: 'bot',
        permissions: 0n, // Default permissions
      },
    });

    // Process channel definitions
    if (app.channelDefinitions && Array.isArray(app.channelDefinitions)) {
      const definitions = app.channelDefinitions as any[];

      await Promise.all(definitions.map(async (def) => {
        if (!def.teamName || !def.channelName) return;

        // 1. Create or find the team
        const teamSlug = def.teamSlug || def.teamName.toLowerCase().replace(/ /g, '-');
        let team = await prisma.workspaceTeam.findUnique({
          where: { workspaceId_slug: { workspaceId, slug: teamSlug } },
        });

        if (!team) {
          team = await prisma.workspaceTeam.create({
            data: {
              workspaceId,
              name: def.teamName,
              slug: teamSlug,
              description: def.teamDescription || `Team for ${app.name}`,
              appId: app.id,
            },
          });
        }

        // 2. Create the channel if it doesn't exist
        const channelSlug = def.channelSlug || def.channelName.toLowerCase().replace(/ /g, '-');
        let channel = await prisma.channel.findUnique({
          where: { workspaceId_slug: { workspaceId, slug: channelSlug } },
        });

        if (!channel) {
          channel = await prisma.channel.create({
            data: {
              workspaceId,
              name: def.channelName,
              slug: channelSlug,
              description: def.channelDescription || `Channel for ${app.name}`,
              type: 'private',
              icon: def.icon || 'bot',
              appId: app.id,
              createdById: app.botId,
            },
          });

          // Link channel to team
          await prisma.workspaceTeam.update({
            where: { id: team.id },
            data: { channelId: channel.id },
          });
        }

        // 4. Add the bot to the team and channel so it can manage them
        await prisma.workspaceTeamMember.upsert({
          where: { teamId_userId: { teamId: team.id, userId: app.botId! } },
          update: { role: 'lead' },
          create: { teamId: team.id, userId: app.botId!, role: 'lead' }
        });

        await prisma.channelMember.upsert({
          where: { channelId_userId: { channelId: channel.id, userId: app.botId! } },
          update: { role: 'owner' },
          create: { channelId: channel.id, userId: app.botId!, role: 'owner' }
        });

        // 3. Auto-populate team based on roles if specified
        if (def.autoPopulateRoles && Array.isArray(def.autoPopulateRoles)) {
          const membersToSync = await prisma.workspaceMember.findMany({
            where: {
              workspaceId,
              role: { in: def.autoPopulateRoles },
            },
          });

          if (membersToSync.length > 0) {
            // Batch create team members
            await prisma.workspaceTeamMember.createMany({
              data: membersToSync.map(m => ({
                teamId: team!.id,
                userId: m.userId,
                role: 'member',
              })),
              skipDuplicates: true,
            });

            // Batch create channel members
            await prisma.channelMember.createMany({
              data: membersToSync.map(m => ({
                channelId: channel!.id,
                userId: m.userId,
                role: 'member',
              })),
              skipDuplicates: true,
            });
          }
        }
      }));
    }

    return member_result;
  }

  private generateBotToken(userId: string): string {
    const base64Id = Buffer.from(userId).toString('base64');
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = crypto
      .createHmac('sha256', process.env.BOT_TOKEN_SECRET || 'default_secret')
      .update(`${base64Id}.${timestamp}`)
      .digest('base64url');

    return `${base64Id}.${timestamp}.${signature}`;
  }
}

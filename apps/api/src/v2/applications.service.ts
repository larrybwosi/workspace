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
    // For simplicity, let's check if they are owner or have a high role if we don't have bitwise check easily here
    // Actually we have hasPermission in common/permissions.ts
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

    return prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: app.botId,
        role: 'bot',
        permissions: 0n, // Default permissions
      },
    });
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

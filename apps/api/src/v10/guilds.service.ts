import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { prisma } from '@repo/database';
import { hasPermission, Permissions } from '../common/permissions';

@Injectable()
export class V10GuildsService {
  async getGuild(bot: any, guildId: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { id: guildId },
      include: {
        members: {
          include: { user: true },
        },
      },
    });

    if (!workspace) throw new NotFoundException('Unknown Guild');

    const botMember = workspace.members.find((m) => m.userId === bot.id);
    if (!botMember) throw new ForbiddenException('Forbidden');

    return {
      id: workspace.id,
      name: workspace.name,
      icon: workspace.icon,
      owner_id: workspace.ownerId,
      region: 'us-east',
      afk_channel_id: null,
      afk_timeout: 300,
      widget_enabled: true,
      verification_level: 0,
      roles: [],
      emojis: [],
      features: [],
      mfa_level: 0,
      application_id: bot.botApplication?.id || null,
      system_channel_id: null,
      rules_channel_id: null,
      max_presences: 250000,
      max_members: 250000,
      vanity_url_code: workspace.slug,
      description: workspace.description,
      banner: null,
      premium_tier: 0,
      premium_subscription_count: 0,
      preferred_locale: 'en-US',
      public_updates_channel_id: null,
      approximate_member_count: workspace.members.length,
      approximate_presence_count: workspace.members.filter((m) => m.user.status === 'online').length,
      nsfw_level: 0,
      stickers: [],
      premium_progress_bar_enabled: false,
    };
  }

  async addMemberRole(bot: any, guildId: string, userId: string, roleId: string) {
    const botMember = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: guildId, userId: bot.id } },
    });

    if (!botMember) throw new ForbiddenException('Bot is not a member of this guild');
    if (!hasPermission(BigInt(botMember.permissions || 0), Permissions.MANAGE_ROLES)) {
      throw new ForbiddenException('Bot missing MANAGE_ROLES permission');
    }

    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: guildId, userId: userId } },
    });

    if (!member) throw new NotFoundException('Member not found');

    await prisma.workspaceMember.update({
      where: { id: member.id },
      data: { role: roleId },
    });

    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId: guildId,
        userId: bot.id,
        action: 'BOT_MEMBER_ROLE_ADD',
        resource: 'member',
        resourceId: userId,
        metadata: { roleId },
      },
    });

    return null;
  }

  async removeMemberRole(bot: any, guildId: string, userId: string, roleId: string) {
    const botMember = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: guildId, userId: bot.id } },
    });

    if (!botMember || !hasPermission(BigInt(botMember.permissions || 0), Permissions.MANAGE_ROLES)) {
      throw new ForbiddenException('Forbidden');
    }

    await prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId: guildId, userId: userId } },
      data: { role: 'member' },
    });

    return null;
  }
}

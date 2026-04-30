import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { prisma } from '@repo/database';
import { hasPermission, Permissions } from '../common/permissions';

@Injectable()
export class V10GuildsService {
  async getChannels(bot: any, guildId: string) {
    const channels = await prisma.channel.findMany({
      where: { workspaceId: guildId },
    });

    return channels.map((c) => ({
      id: c.id,
      type: c.type === 'channel' ? 0 : 2,
      guild_id: c.workspaceId,
      name: c.name,
      topic: c.description,
      nsfw: false,
      last_message_id: null,
      bitrate: 64000,
      user_limit: 0,
      permission_overwrites: [],
      position: 0,
      parent_id: c.parentId,
    }));
  }

  async getMembers(bot: any, guildId: string, query: { limit?: number; after?: string }) {
    const { limit = 50, after } = query;

    const members = await prisma.workspaceMember.findMany({
      where: {
        workspaceId: guildId,
        ...(after && { id: { gt: after } }),
      },
      take: limit,
      include: { user: true },
    });

    return members.map((m) => ({
      user: {
        id: m.user.id,
        username: m.user.name,
        avatar: m.user.avatar,
        bot: m.user.isBot,
      },
      nick: null,
      roles: [this.mapInternalRoleToDiscord(m.role)],
      joined_at: m.joinedAt.toISOString(),
      deaf: false,
      mute: false,
    }));
  }

  async getRoles(bot: any, guildId: string) {
    // Our system has a simplified role system, but we can return some defaults
    // Mapping internal roles to snowflake-like strings for Discord library compatibility
    return [
      {
        id: '100000000000000001', // owner
        name: 'Owner',
        color: 0,
        hoist: true,
        position: 1,
        permissions: '8', // ADMINISTRATOR
        managed: false,
        mentionable: true,
      },
      {
        id: '100000000000000002', // admin
        name: 'Admin',
        color: 0,
        hoist: true,
        position: 2,
        permissions: '8',
        managed: false,
        mentionable: true,
      },
      {
        id: '100000000000000003', // member
        name: 'Member',
        color: 0,
        hoist: false,
        position: 3,
        permissions: '104320577',
        managed: false,
        mentionable: false,
      },
    ];
  }

  private mapInternalRoleToDiscord(role: string): string {
    switch (role) {
      case 'owner': return '100000000000000001';
      case 'admin': return '100000000000000002';
      case 'member': return '100000000000000003';
      default: return '100000000000000003';
    }
  }

  private mapDiscordRoleToInternal(roleId: string): string {
    switch (roleId) {
      case '100000000000000001': return 'owner';
      case '100000000000000002': return 'admin';
      case '100000000000000003': return 'member';
      case 'owner': return 'owner';
      case 'admin': return 'admin';
      case 'member': return 'member';
      default: return 'member';
    }
  }

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

    // Discord allows multiple roles, but our system has one 'role' field and 'permissions' (BigInt).
    // Mapping 'owner', 'admin', 'member' to our 'role' field.
    const mappedRoleId = this.mapDiscordRoleToInternal(roleId);
    let targetRole = member.role;
    if (['owner', 'admin', 'member'].includes(mappedRoleId)) {
      targetRole = mappedRoleId;
    }

    // Also update permissions if it's a known roleId
    let targetPermissions = member.permissions;
    if (mappedRoleId === 'admin') {
        targetPermissions = BigInt(Permissions.ADMINISTRATOR);
    } else if (mappedRoleId === 'member') {
        targetPermissions = BigInt(104320577); // Default member permissions
    }

    await prisma.workspaceMember.update({
      where: { id: member.id },
      data: {
        role: targetRole,
        permissions: targetPermissions,
      },
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

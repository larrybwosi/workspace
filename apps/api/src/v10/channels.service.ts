import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { prisma } from '@repo/database';
import { publishToAbly, AblyChannels, AblyEvents, notifyAppExclusive } from '@repo/shared/server';
import { hasPermission, Permissions } from '../common/permissions';

@Injectable()
export class V10ChannelsService {
  async getChannel(id: string) {
    const channel = await prisma.channel.findUnique({
      where: { id },
    });

    if (!channel) throw new NotFoundException('Unknown Channel');

    return {
      id: channel.id,
      type: channel.type === 'channel' ? 0 : 2, // 0: GUILD_TEXT, 2: GUILD_VOICE
      guild_id: channel.workspaceId,
      name: channel.name,
      topic: channel.description,
      nsfw: false,
      last_message_id: null,
      bitrate: 64000,
      user_limit: 0,
      permission_overwrites: [],
      position: 0,
      parent_id: channel.parentId,
    };
  }

  async getMessages(channelId: string, query: { limit?: number; before?: string; after?: string }) {
    const { limit = 50, before, after } = query;

    const messages = await prisma.message.findMany({
      where: {
        channelId,
        ...(before && { id: { lt: before } }),
        ...(after && { id: { gt: after } }),
      },
      take: limit,
      orderBy: { timestamp: 'desc' },
      include: { user: true },
    });

    return messages.map((m) => ({
      id: m.id,
      type: 0,
      content: m.content,
      channel_id: m.channelId,
      author: {
        id: m.user.id,
        username: m.user.name,
        avatar: m.user.avatar,
        bot: m.user.isBot,
      },
      attachments: [],
      embeds: (m.metadata as any)?.embeds || [],
      mentions: [],
      mention_roles: [],
      pinned: false,
      mention_everyone: false,
      tts: false,
      timestamp: m.timestamp.toISOString(),
      edited_timestamp: m.isEdited ? m.updatedAt.toISOString() : null,
      flags: m.flags,
      components: (m.metadata as any)?.components || [],
    }));
  }

  async updateMessage(bot: any, channelId: string, messageId: string, data: any) {
    const { content, embeds, components } = data;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) throw new NotFoundException('Unknown Message');
    if (message.userId !== bot.id) throw new ForbiddenException('You can only edit your own messages');

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: content || message.content,
        isEdited: true,
        metadata: {
          ...(message.metadata as any),
          ...(embeds && { embeds }),
          ...(components && { components }),
        },
      },
      include: { user: true },
    });

    await publishToAbly(AblyChannels.channel(channelId), AblyEvents.MESSAGE_UPDATED, {
      message: {
        ...updatedMessage,
        user: {
          id: bot.id,
          name: bot.name,
          avatar: bot.avatar,
          isBot: true,
        },
      },
    });

    return {
      id: updatedMessage.id,
      type: 0,
      content: updatedMessage.content,
      channel_id: updatedMessage.channelId,
      author: {
        id: bot.id,
        username: bot.name,
        avatar: bot.avatar,
        bot: true,
      },
      attachments: [],
      embeds: (updatedMessage.metadata as any)?.embeds || [],
      mentions: [],
      mention_roles: [],
      pinned: false,
      mention_everyone: false,
      tts: false,
      timestamp: updatedMessage.timestamp.toISOString(),
      edited_timestamp: updatedMessage.updatedAt.toISOString(),
      flags: updatedMessage.flags,
      components: (updatedMessage.metadata as any)?.components || [],
    };
  }

  async deleteMessage(bot: any, channelId: string, messageId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) throw new NotFoundException('Unknown Message');

    // Bot can delete its own messages, or if it has MANAGE_MESSAGES permission
    if (message.userId !== bot.id) {
        // Check permissions (simplified for now)
        const channel = await prisma.channel.findUnique({
            where: { id: channelId },
            include: {
              members: { where: { userId: bot.id } },
              workspace: { include: { members: { where: { userId: bot.id } } } },
            },
        });

        const workspaceMember = channel?.workspace?.members[0];
        const channelMember = channel?.members[0];
        const perms = BigInt(workspaceMember?.permissions || 0) | BigInt(channelMember?.permissions || 0);

        if (!hasPermission(perms, Permissions.MANAGE_MESSAGES)) {
            throw new ForbiddenException('Missing Permissions');
        }
    }

    await prisma.message.delete({
      where: { id: messageId },
    });

    await publishToAbly(AblyChannels.channel(channelId), AblyEvents.MESSAGE_DELETED, {
      messageId,
      channelId,
    });

    return null;
  }

  async createMessage(bot: any, channelId: string, data: any) {
    const { content, embeds, components, message_reference, exclusive_notification } = data;

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        members: { where: { userId: bot.id } },
        workspace: { include: { members: { where: { userId: bot.id } } } },
      },
    });

    if (!channel) throw new NotFoundException('Unknown Channel');

    // Enterprise Logic: Permission Check
    const workspaceMember = channel.workspace?.members[0];
    const channelMember = channel.members[0];

    const perms = BigInt(workspaceMember?.permissions || 0) | BigInt(channelMember?.permissions || 0);

    if (!hasPermission(perms, Permissions.SEND_MESSAGES)) {
      throw new ForbiddenException('Missing Permissions');
    }

    const message = await prisma.message.create({
      data: {
        content: content || '',
        userId: bot.id,
        channelId: channelId,
        messageType: 'bot-message',
        metadata: {
          embeds: embeds || [],
          components: components || [],
          referencedMessage: message_reference?.message_id,
        },
      },
    });

    // Log action
    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId: channel.workspaceId!,
        userId: bot.id,
        action: 'BOT_MESSAGE_CREATE',
        resource: 'message',
        resourceId: message.id,
        metadata: { channelId },
      },
    });

    // Handle exclusive notification if requested
    if (exclusive_notification && channel.appId) {
      await notifyAppExclusive(
        channelId,
        exclusive_notification.title || `New announcement from ${bot.name}`,
        exclusive_notification.message || content || 'Click to view details',
        exclusive_notification.linkUrl || `/workspace/${channel.workspace?.slug || 'default'}/channels/${channel.slug || channelId}?messageId=${message.id}`,
        { botId: bot.id, appId: channel.appId }
      );
    }

    // Notify clients
    await publishToAbly(AblyChannels.channel(channelId), AblyEvents.MESSAGE_SENT, {
      message: {
        ...message,
        user: {
          id: bot.id,
          name: bot.name,
          avatar: bot.avatar,
          status: bot.status,
          isBot: true,
        },
      },
    });

    return {
      id: message.id,
      type: 0,
      content: message.content,
      channel_id: message.channelId,
      author: {
        id: bot.id,
        username: bot.name,
        avatar: bot.avatar,
        bot: true,
      },
      attachments: [],
      embeds: embeds || [],
      mentions: [],
      mention_roles: [],
      pinned: false,
      mention_everyone: false,
      tts: false,
      timestamp: message.timestamp.toISOString(),
      edited_timestamp: null,
      flags: 0,
      components: components || [],
    };
  }
}

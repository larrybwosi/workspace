import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { prisma } from '@repo/database';
import { publishToAbly, AblyChannels, AblyEvents } from '@repo/shared';
import { hasPermission, Permissions } from '../common/permissions';

@Injectable()
export class V10ChannelsService {
  async createMessage(bot: any, channelId: string, data: any) {
    const { content, embeds, components, message_reference } = data;

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

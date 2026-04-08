import { Injectable, ForbiddenException } from '@nestjs/common';
import { prisma } from '@repo/database';
import { getAblyRest, AblyChannels, AblyEvents } from '../lib/integrations/ably';
import { extractUserMentions, extractChannelMentions, hasSpecialMention, extractUserIds } from '../common/utils/mention-utils';
import { NotificationsService } from '../notifications/notifications.service';
import { isUserEligibleForAsset, logAssetUsage } from '@repo/shared';

@Injectable()
export class ChannelsService {
  constructor(private readonly notificationsService: NotificationsService) {}

  async getGlobalChannels() {
    return prisma.channel.findMany({
      where: {
        workspaceId: null,
      },
      include: {
        children: true,
        members: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  async createChannel(body: any) {
    const { name, icon, type, description, isPrivate, parentId, members } = body;

    return prisma.channel.create({
      data: {
        name,
        icon: icon || "#",
        type: type || "channel",
        description,
        isPrivate: isPrivate || false,
        parentId,
        members: members
          ? {
              create: members.map((userId: string) => ({
                userId,
                role: "member",
              })),
            }
          : undefined,
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async getMessages(channelId: string, cursor?: string, limitNum = 50) {
    const messages = await prisma.message.findMany({
      where: {
        channelId,
        ...(cursor ? { timestamp: { lt: new Date(cursor) } } : {}),
      },
      include: {
        user: true,
        reactions: true,
        attachments: true,
        mentions: true,
        readBy: true,
        replyTo: {
          include: {
            user: true,
          },
        },
        replies: {
          include: {
            user: true,
            reactions: true,
            readBy: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limitNum + 1,
    });

    const hasMore = messages.length > limitNum;
    const data = hasMore ? messages.slice(0, limitNum) : messages;
    const nextCursor = hasMore ? data[data.length - 1].timestamp.toISOString() : null;

    return {
      messages: data.reverse(),
      nextCursor,
      hasMore,
    };
  }

  async createMessage(channelId: string, userId: string, body: any) {
    const { content, messageType, metadata, replyToId, attachments, stickerId } = body;

    const userMentions = extractUserMentions(content);
    const channelMentions = extractChannelMentions(content);
    const mentionsAll = hasSpecialMention(content, 'all');
    const mentionsHere = hasSpecialMention(content, 'here');

    const users = await prisma.user.findMany();
    const mentionedUserIds = extractUserIds(userMentions, users);

    // Eligibility check for stickers
    if (stickerId) {
      const sticker = await prisma.sticker.findUnique({ where: { id: stickerId } });
      if (sticker && sticker.rules) {
        const isEligible = await isUserEligibleForAsset(userId, sticker.rules);
        if (!isEligible) {
          throw new ForbiddenException('Not eligible to use this sticker');
        }
      }
      await logAssetUsage({
        assetId: stickerId,
        assetType: 'sticker',
        userId: userId,
        workspaceId: sticker?.workspaceId || undefined
      });
    }

    const message = await prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          channelId,
          userId,
          content,
          messageType: messageType || 'standard',
          metadata: { ...metadata, stickerId },
          replyToId,
          depth: replyToId ? 1 : 0,
          mentions: {
            create: [
              ...userMentions.map((mention: string) => ({ mention })),
              ...channelMentions.map((mention: string) => ({ mention: `#${mention}` })),
              ...(mentionsAll ? [{ mention: '@all' }] : []),
              ...(mentionsHere ? [{ mention: '@here' }] : []),
            ],
          },
          attachments: attachments
            ? {
                create: attachments.map((att: any) => ({
                  name: att.name,
                  type: att.type,
                  url: att.url,
                  size: att.size,
                })),
              }
            : undefined,
        },
        include: {
          user: true,
          reactions: true,
          attachments: true,
          mentions: true,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { messageCount: { increment: 1 } },
      });

      return msg;
    });

    const sender = message.user;

    // Notify specific users
    for (const mentionedUserId of mentionedUserIds) {
      if (mentionedUserId !== userId) {
        await this.notificationsService.notifyMention(message.id, mentionedUserId, sender?.name || 'Someone', channelId, content);
      }
    }

    // Notify @all / @here
    if (mentionsAll || mentionsHere) {
      await this.notificationsService.notifyChannel(channelId, sender?.name || 'Someone', message.id, content, mentionsHere);
    }

    const ably = getAblyRest();
    if (ably) {
      const channel = ably.channels.get(AblyChannels.channel(channelId));
      await channel.publish(AblyEvents.MESSAGE_SENT, message);
    }

    return message;
  }

  async updateMessage(channelId: string, messageId: string, userId: string, content: string) {
    const message = await prisma.message.update({
      where: { id: messageId },
      data: {
        content,
        isEdited: true,
      },
      include: {
        user: true,
        reactions: true,
        attachments: true,
        mentions: true,
      },
    });

    const ably = getAblyRest();
    if (ably) {
      const channel = ably.channels.get(AblyChannels.channel(channelId));
      await channel.publish(AblyEvents.MESSAGE_UPDATED, message);
    }

    return message;
  }

  async deleteMessage(channelId: string, messageId: string) {
    await prisma.message.delete({
      where: { id: messageId },
    });

    const ably = getAblyRest();
    if (ably) {
      const channel = ably.channels.get(AblyChannels.channel(channelId));
      await channel.publish(AblyEvents.MESSAGE_DELETED, { id: messageId });
    }

    return { success: true };
  }

  async markAsRead(userId: string, messageIds: string[]) {
    const readPromises = messageIds.map((messageId) =>
      prisma.messageRead.upsert({
        where: {
          messageId_userId: {
            messageId,
            userId,
          },
        },
        update: {
          readAt: new Date(),
        },
        create: {
          messageId,
          userId,
          readAt: new Date(),
        },
      }),
    );

    await Promise.all(readPromises);
    return { success: true };
  }

  async addReaction(channelId: string, messageId: string, userId: string, emoji: string) {
    const reaction = await prisma.reaction.upsert({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji,
        },
      },
      update: {},
      create: {
        messageId,
        userId,
        emoji,
      },
    });

    const ably = getAblyRest();
    if (ably) {
      const channel = ably.channels.get(AblyChannels.channel(channelId));
      await channel.publish(AblyEvents.MESSAGE_REACTION, { messageId, reaction, action: 'add' });
    }

    return reaction;
  }

  async removeReaction(channelId: string, messageId: string, userId: string, emoji: string) {
    const reaction = await prisma.reaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji,
        },
      },
    });

    if (reaction) {
      await prisma.reaction.delete({
        where: { id: reaction.id },
      });

      const ably = getAblyRest();
      if (ably) {
        const channel = ably.channels.get(AblyChannels.channel(channelId));
        await channel.publish(AblyEvents.MESSAGE_REACTION, { messageId, emoji, userId, action: 'remove' });
      }
    }

    return { success: true };
  }

  async createReply(channelId: string, messageId: string, userId: string, body: any) {
    const { content, attachments } = body;

    const reply = await prisma.message.create({
      data: {
        channelId,
        userId: userId,
        content,
        replyToId: messageId,
        depth: 1,
        attachments: attachments
          ? {
              create: attachments.map((att: any) => ({
                name: att.name,
                type: att.type,
                url: att.url,
                size: att.size,
              })),
            }
          : undefined,
      },
      include: {
        user: true,
        reactions: true,
        attachments: true,
        mentions: true,
      },
    });

    const ably = getAblyRest();
    if (ably) {
      const channel = ably.channels.get(AblyChannels.channel(channelId));
      await channel.publish(AblyEvents.MESSAGE_SENT, reply);
    }

    return reply;
  }
}

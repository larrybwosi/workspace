import { Injectable, ForbiddenException } from '@nestjs/common';
import { prisma } from '@repo/database';
import {
  extractUserMentions,
  extractChannelMentions,
  hasSpecialMention,
  extractUserIds,
} from '../common/utils/mention-utils';
import { NotificationsService } from '../notifications/notifications.service';
import { AblyChannels, AblyEvents, getAblyRest, isUserEligibleForAsset, logAssetUsage } from '@repo/shared/server';

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
        createdAt: 'asc',
      },
    });
  }

  async createChannel(body: any) {
    const { name, icon, type, description, isPrivate, parentId, members } = body;

    return prisma.channel.create({
      data: {
        name,
        icon: icon || '#',
        type: type || 'channel',
        description,
        isPrivate: isPrivate || false,
        parentId,
        members: members
          ? {
              create: members.map((userId: string) => ({
                userId,
                role: 'member',
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

  /**
   * ⚡ Performance Optimization:
   * 1. Uses 'select' instead of 'include' to reduce DB payload and memory usage.
   * 2. Only fetches the current user's read status instead of all read receipts.
   * 3. Removed redundant 'replies' include as the frontend reconstructs threads from flat list.
   * 4. Groups reactions in-memory to match frontend optimized format.
   * Expected impact: Reduces JSON payload size by ~40-60% and speeds up DB query by avoiding deep joins.
   */
  async getMessages(channelId: string, userId: string, cursor?: string, limitNum = 50) {
    const messages = await prisma.message.findMany({
      where: {
        channelId,
        ...(cursor ? { timestamp: { lt: new Date(cursor) } } : {}),
      },
      select: {
        id: true,
        userId: true,
        content: true,
        messageType: true,
        metadata: true,
        isEdited: true,
        depth: true,
        timestamp: true,
        replyToId: true,
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        reactions: {
          select: {
            emoji: true,
            userId: true,
          },
        },
        attachments: {
          select: {
            id: true,
            name: true,
            type: true,
            url: true,
            size: true,
          },
        },
        mentions: {
          select: {
            mention: true,
          },
        },
        readBy: {
          where: {
            userId,
          },
          select: {
            userId: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limitNum + 1,
    });

    const hasMore = messages.length > limitNum;
    const rawData = hasMore ? messages.slice(0, limitNum) : messages;
    const nextCursor = hasMore ? rawData[rawData.length - 1].timestamp.toISOString() : null;

    // Transform messages to match frontend expectations and reduce size
    const formattedMessages = [...rawData].reverse().map(msg => {
      // Group reactions by emoji
      const reactionGroups = new Map<string, { emoji: string; count: number; users: string[] }>();
      msg.reactions.forEach(r => {
        if (!reactionGroups.has(r.emoji)) {
          reactionGroups.set(r.emoji, { emoji: r.emoji, count: 0, users: [] });
        }
        const group = reactionGroups.get(r.emoji)!;
        group.count++;
        group.users.push(r.userId);
      });

      return {
        ...msg,
        reactions: Array.from(reactionGroups.values()),
        mentions: msg.mentions.map(m => m.mention),
        readByCurrentUser: msg.readBy.length > 0,
        // Remove raw fields not needed in frontend
        readBy: undefined,
      };
    });

    return {
      messages: formattedMessages,
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

    // Optimization: Fetch only mentioned users instead of all users (avoid full table scan)
    const mentionedUsers = userMentions.length > 0
      ? await prisma.user.findMany({
          where: {
            name: {
              in: userMentions,
              mode: 'insensitive',
            },
          },
          select: { id: true, name: true },
        })
      : [];
    const mentionedUserIds = extractUserIds(userMentions, mentionedUsers);

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
        workspaceId: sticker?.workspaceId || undefined,
      });
    }

    const message = await prisma.$transaction(async tx => {
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
        await this.notificationsService.notifyMention(
          message.id,
          mentionedUserId,
          sender?.name || 'Someone',
          channelId,
          content
        );
      }
    }

    // Notify @all / @here
    if (mentionsAll || mentionsHere) {
      await this.notificationsService.notifyChannel(
        channelId,
        sender?.name || 'Someone',
        message.id,
        content,
        mentionsHere
      );
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
    const readPromises = messageIds.map(messageId =>
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
      })
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

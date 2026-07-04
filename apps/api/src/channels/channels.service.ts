import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { prisma } from '@repo/database';
import {
  extractUserMentions,
  extractChannelMentions,
  hasSpecialMention,
  extractUserIds,
} from '../common/utils/mention-utils';
import { NotificationsService } from '../notifications/notifications.service';
import { AblyChannels, AblyEvents, publishRealtime, isUserEligibleForAsset, logAssetUsage } from '@repo/shared/server';

@Injectable()
export class ChannelsService {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * ⚡ Performance Optimization:
   * 1. Replaces full 'members' list with a simple count to avoid massive JSON payloads.
   * 2. This is safe as the 'Channel' type in '@repo/types' does not include the members array.
   * Expected impact: Reduces JSON payload size by ~80-90% for instances with many users.
   */
  async getGlobalChannels() {
    return prisma.channel.findMany({
      where: {
        workspaceId: null,
      },
      include: {
        children: true,
        _count: {
          select: {
            members: true,
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
    /**
     * ⚡ Performance Optimization:
     * 1. Consolidates channel existence, direct membership, workspace membership, and shared access
     *    verification into a single database query using nested 'select' and relation filters.
     * 2. This reduces database round-trips from 4 down to 1.
     * 3. Avoids deep joins or full table scans by using targeted relation filters.
     */
    /**
     * ⚡ Performance Optimization:
     * Consolidates channel existence check, direct membership check, workspace membership check,
     * and shared channel access verification into a single database query using nested 'select'.
     * Reduces database round-trips from up to 4 down to 1.
     */
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      select: {
        id: true,
        workspaceId: true,
        isPrivate: true,
        members: {
          where: { userId },
          select: { userId: true },
        },
        workspace: {
          select: {
            members: {
              where: { userId },
              select: { userId: true },
            },
          },
        },
        sharedWith: {
          where: {
            status: 'ACTIVE',
            workspace: {
              members: { some: { userId } },
            },
          },
          select: { id: true },
        },
      },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const isDirectMember = channel.members.length > 0;
    const isWorkspaceMember = (channel.workspace?.members?.length ?? 0) > 0;
    const isSharedMember = channel.sharedWith.length > 0;

    if (!isDirectMember) {
      if (channel.workspaceId) {
        if (!isWorkspaceMember) {
          if (!isSharedMember) {
            throw new ForbiddenException('You do not have access to this channel');
          }
        } else if (channel.isPrivate) {
          throw new ForbiddenException('You do not have access to this private channel');
        }
      } else if (channel.isPrivate) {
        throw new ForbiddenException('You do not have access to this private channel');
      }
    }

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
            image: true,
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
            content: true,
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                image: true,
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

    const formattedMessages = rawData.map(msg => {
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
        user: msg.user
          ? {
              ...msg.user,
              avatar: msg.user.avatar || msg.user.image,
            }
          : null,
        replyTo:
          msg.replyTo && msg.replyTo.user
            ? {
                ...msg.replyTo,
                user: {
                  ...msg.replyTo.user,
                  avatar: msg.replyTo.user.avatar || msg.replyTo.user.image,
                },
              }
            : msg.replyTo,
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
    const mentionedUsers =
      userMentions.length > 0
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
      // Optimization: Only check for support ticket if channel type suggests it
      const channel = await tx.channel.findUnique({
        where: { id: channelId },
        select: { type: true },
      });

      if (channel?.type === 'support_ticket') {
        const ticket = await tx.supportTicket.findUnique({
          where: { channelId },
        });

        if (ticket) {
          await tx.supportTicket.update({
            where: { id: ticket.id },
            data: { lastMessageAt: new Date() },
          });
        }
      }

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

    await this.handleMessageNotifications(
      message.id,
      channelId,
      userId,
      sender?.name || 'Someone',
      content,
      mentionedUserIds,
      mentionsAll,
      mentionsHere
    );

    await publishRealtime(AblyChannels.channel(channelId), AblyEvents.MESSAGE_SENT, message);

    return message;
  }

  private async handleMessageNotifications(
    messageId: string,
    channelId: string,
    userId: string,
    senderName: string,
    content: string,
    mentionedUserIds: string[],
    mentionsAll: boolean,
    mentionsHere: boolean
  ) {
    const recipientIds = mentionedUserIds.filter(id => id !== userId);
    if (recipientIds.length > 0) {
      await this.notificationsService.notifyMentions(messageId, recipientIds, senderName, channelId, content);
    }

    if (mentionsAll || mentionsHere) {
      await this.notificationsService.notifyChannel(channelId, senderName, messageId, content, mentionsHere);
    }

    await this.notificationsService.notifyNewMessage(
      channelId,
      userId,
      senderName,
      messageId,
      content,
      mentionedUserIds
    );
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

    await publishRealtime(AblyChannels.channel(channelId), AblyEvents.MESSAGE_UPDATED, message);

    return message;
  }

  async deleteMessage(channelId: string, messageId: string) {
    await prisma.message.delete({
      where: { id: messageId },
    });

    await publishRealtime(AblyChannels.channel(channelId), AblyEvents.MESSAGE_DELETED, { id: messageId });

    return { success: true };
  }

  async markAsRead(userId: string, messageIds: string[], channelId?: string) {
    if (!messageIds.length) return { success: true };

    // ⚡ Performance Optimization:
    // Replaces sequential upsert calls with a single batch 'createMany' operation.
    // This reduces O(N) database round-trips to O(1).
    // We use skipDuplicates to avoid errors for already read messages.
    await prisma.messageRead.createMany({
      data: messageIds.map(messageId => ({
        messageId,
        userId,
        readAt: new Date(),
      })),
      skipDuplicates: true,
    });

    // ⚡ Optimization: Publish read status if channelId is provided
    if (channelId) {
      await publishRealtime(AblyChannels.user(userId), AblyEvents.MESSAGE_READ, {
        channelId,
        messageIds,
      });
    }

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

    await publishRealtime(AblyChannels.channel(channelId), AblyEvents.MESSAGE_REACTION, {
      messageId,
      reaction,
      action: 'add',
    });

    return reaction;
  }

  async removeReaction(channelId: string, messageId: string, userId: string, emoji: string) {
    /**
     * ⚡ Performance Optimization:
     * Replaces sequential 'findUnique' and 'delete' with a single atomic 'delete' using the
     * compound unique index. This reduces database round-trips from 2 down to 1.
     * Expected impact: Faster reaction removal and reduced database load.
     */
    try {
      await prisma.reaction.delete({
        where: {
          messageId_userId_emoji: {
            messageId,
            userId,
            emoji,
          },
        },
      });

      await publishRealtime(AblyChannels.channel(channelId), AblyEvents.MESSAGE_REACTION, {
        messageId,
        emoji,
        userId,
        action: 'remove',
      });
    } catch (error) {
      // Prisma error code for 'Record to delete does not exist' - we ignore it here
      // to maintain idempotency and match previous behavior.
      if ((error as any).code !== 'P2025') {
        throw error;
      }
    }

    return { success: true };
  }

  async inviteWorkspaceToChannel(channelId: string, workspaceId: string) {
    return prisma.sharedChannel.create({
      data: {
        channelId,
        workspaceId,
        status: 'PENDING',
      },
    });
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

    await publishRealtime(AblyChannels.channel(channelId), AblyEvents.MESSAGE_SENT, reply);

    // Notify the author of the parent message about the reply
    await this.notificationsService.notifyReply(
      channelId,
      userId,
      reply.user?.name || 'Someone',
      messageId,
      reply.id,
      content
    );

    return reply;
  }
}

import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { prisma } from '@repo/database';
import {
  getAblyRest,
  AblyChannels,
  AblyEvents,
  notifyMention,
  notifyChannel,
  isUserEligibleForAsset,
  logAssetUsage,
} from '@repo/shared/server';
import * as crypto from 'crypto';
import axios from 'axios';
import {
  extractChannelMentions,
  extractUserIds,
  extractUserMentions,
  hasSpecialMention,
} from '@/common/utils/mention-utils';

@Injectable()
export class MessagesService {
  // --- Core Validations ---
  async verifyWorkspaceAccess(userId: string, slug: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspace.id,
          userId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('Forbidden');
    }

    return workspace;
  }

  // --- Message Operations ---
  /**
   * ⚡ Performance Optimization:
   * 1. Uses 'select' instead of 'include' to reduce DB payload and memory usage.
   * 2. Only fetches the current user's read status instead of all read receipts.
   * 3. Removed redundant 'replies' include as the frontend reconstructs threads from flat list.
   * 4. Groups reactions in-memory to match frontend optimized format.
   * Expected impact: Reduces JSON payload size by ~40-60% and speeds up DB query by avoiding deep joins.
   */
  async getMessages(channelId: string, userId: string, cursor?: string, limit = 50) {
    if (!channelId) {
      throw new BadRequestException('Channel ID required');
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
      take: limit + 1,
    });

    const hasMore = messages.length > limit;
    const rawData = hasMore ? messages.slice(0, limit) : messages;
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
        // We keep replyTo as an object because the UI uses it for the 'replied to' header
        // while also keeping the ID available if needed.
        // Remove raw fields not needed in frontend
        replyToId: undefined,
        readBy: undefined,
      };
    });

    return {
      messages: formattedMessages,
      nextCursor,
      hasMore,
    };
  }

  async createMessage(userId: string, body: any) {
    const { channelId, content, messageType, metadata, replyToId, attachments, stickerId } = body;

    if (!channelId) {
      throw new BadRequestException('Channel ID required');
    }

    const userMentions = extractUserMentions(content || '');
    const channelMentions = extractChannelMentions(content || '');
    const mentionsAll = hasSpecialMention(content || '', 'all');
    const mentionsHere = hasSpecialMention(content || '', 'here');

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
      // 1. Create the message
      const msg = await tx.message.create({
        data: {
          channelId,
          userId: userId,
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

      // 2. Increment user's message count
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
        await notifyMention(message.id, mentionedUserId, sender?.name || 'Someone', channelId, content);
      }
    }

    // Notify @all / @here
    if (mentionsAll || mentionsHere) {
      await notifyChannel(channelId, sender?.name || 'Someone', message.id, content, mentionsHere);
    }

    const ably = getAblyRest();
    if (ably) {
      const channel = (ably as any).channels.get(AblyChannels.channel(channelId));
      await channel.publish(AblyEvents.MESSAGE_SENT, message);
    }

    return message;
  }

  async updateMessage(userId: string, messageId: string, content: string) {
    const existingMessage = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!existingMessage || existingMessage.userId !== userId) {
      throw new ForbiddenException('You can only update your own messages');
    }

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
      // Send updates to the main channel like in the controller
      const channel = (ably as any).channels.get(AblyChannels.channel(message.channelId));
      await channel.publish(AblyEvents.MESSAGE_UPDATED, message);
    }

    return message;
  }

  async deleteMessage(userId: string, messageId: string) {
    const existingMessage = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        rootThread: true,
        attachments: true,
        _count: {
          select: { replies: true },
        },
      },
    });

    if (!existingMessage) {
      throw new NotFoundException('Message not found');
    }

    if (existingMessage.userId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    const channelId = existingMessage.channelId;

    if (existingMessage.rootThread) {
      await prisma.thread.delete({
        where: { id: existingMessage.rootThread.id },
      });
    } else if (existingMessage._count.replies > 0) {
      await prisma.message.update({
        where: { id: messageId },
        data: {
          content: '[Message Deleted]',
          attachments: { deleteMany: {} },
          isEdited: true,
        },
      });
    } else {
      await prisma.message.delete({
        where: { id: messageId },
      });
    }

    const ably = getAblyRest();
    if (ably) {
      const channel = (ably as any).channels.get(AblyChannels.channel(channelId));
      await channel.publish(AblyEvents.MESSAGE_DELETED, {
        id: messageId,
        threadId: existingMessage.rootThread?.id,
      });
    }

    return { success: true };
  }

  async searchMessages(userId: string, query: string, filter?: string, channelId?: string) {
    if (!query) {
      return { results: [] };
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    const whereClause: any = {
      content: {
        contains: query,
        mode: 'insensitive',
      },
    };

    if (channelId) {
      whereClause.channelId = channelId;
    }

    if (filter === 'mentions') {
      whereClause.mentions = {
        some: {
          mention: {
            contains: user?.name,
          },
        },
      };
    }

    if (filter === 'files') {
      whereClause.attachments = {
        some: {},
      };
    }

    if (filter === 'links') {
      whereClause.content = {
        contains: 'http',
        mode: 'insensitive',
      };
    }

    if (filter === 'from-me') {
      whereClause.userId = userId;
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      // ⚡ Optimization: Select only required fields from relations to reduce DB load and memory usage
      include: {
        user: {
          select: {
            name: true,
            avatar: true,
          },
        },
        channel: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 50,
    });

    return {
      results: messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        userName: msg.user.name,
        userAvatar: (msg.user as any).avatar,
        timestamp: msg.timestamp,
        channelName: msg.channel.name,
        channelId: msg.channelId,
      })),
    };
  }

  // --- Read Receipts ---
  async markMessageAsRead(userId: string, messageId: string) {
    await prisma.messageRead.upsert({
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
    });

    return { success: true };
  }

  async batchMarkAsRead(userId: string, messageIds: string[]) {
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

  // --- Reactions ---
  async addReaction(userId: string, messageId: string, emoji: string, customEmojiId?: string) {
    if (customEmojiId) {
      const customEmoji = await prisma.customEmoji.findUnique({
        where: { id: customEmojiId },
      });

      if (customEmoji && customEmoji.rules) {
        const isEligible = await isUserEligibleForAsset(userId, customEmoji.rules);
        if (!isEligible) {
          throw new ForbiddenException('Not eligible to use this premium emoji');
        }
      }

      await logAssetUsage({
        assetId: customEmojiId,
        assetType: 'emoji',
        userId: userId,
        workspaceId: customEmoji?.workspaceId || undefined,
      });
    }

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
        customEmojiId,
      },
    });

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    const ably = getAblyRest();
    if (ably && message) {
      const channelId = message.channelId;
      const channel = (ably as any).channels.get(AblyChannels.channel(channelId));
      await channel.publish(AblyEvents.MESSAGE_REACTION, { messageId, reaction, action: 'add' });
    }

    return reaction;
  }

  async removeReaction(userId: string, messageId: string, emoji: string) {
    const reaction = await prisma.reaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji,
        },
      },
    });

    if (!reaction) {
      throw new NotFoundException('Reaction not found');
    }

    await prisma.reaction.delete({
      where: { id: reaction.id },
    });

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    const ably = getAblyRest();
    if (ably && message) {
      const channelId = message.channelId;
      const channel = (ably as any).channels.get(AblyChannels.channel(channelId));
      await channel.publish(AblyEvents.MESSAGE_REACTION, { messageId, emoji, userId, action: 'remove' });
    }

    return { success: true };
  }

  async toggleReaction(userId: string, messageId: string, emoji: string, customEmojiId?: string) {
    const existing = await prisma.reaction.findUnique({
      where: { messageId_userId_emoji: { messageId, userId, emoji } },
    });

    if (existing) {
      return this.removeReaction(userId, messageId, emoji);
    } else {
      return this.addReaction(userId, messageId, emoji, customEmojiId);
    }
  }

  // --- Actions ---
  async processActionResponse(userId: string, messageId: string, data: any) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        actions: true,
        channel: {
          include: {
            workspace: true,
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const action = message.actions.find(a => a.actionId === data.actionId);
    if (!action) {
      throw new NotFoundException('Action not found');
    }

    const existingResponse = await prisma.messageActionResponse.findUnique({
      where: {
        actionId_userId: {
          actionId: action.id,
          userId: userId,
        },
      },
    });

    if (existingResponse) {
      throw new BadRequestException('Action already responded');
    }

    const callbackUrl = (message.metadata as any)?.callbackUrl;

    const response = await prisma.messageActionResponse.create({
      data: {
        actionId: action.id,
        messageId: message.id,
        userId: userId,
        actionValue: data.actionId,
        comment: data.comment,
        metadata: (data.metadata as any) || {},
        webhookUrl: callbackUrl,
        webhookSent: false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        action: true,
      },
    });

    const ably = getAblyRest();
    if (ably) {
      const channel = (ably as any).channels.get(AblyChannels.channel(message.channel.id));
      await channel.publish('message.action_response', {
        messageId: message.id,
        actionId: data.actionId,
        response,
      });
    }

    if (callbackUrl) {
      try {
        const payload = {
          event: 'message.action_response',
          timestamp: new Date().toISOString(),
          workspace: {
            id: message.channel?.workspace?.id,
            name: message.channel.workspace?.name,
          },
          message: {
            id: message.id,
            content: message.content,
            channelId: message.channel.id,
          },
          action: {
            id: data.actionId,
            label: action.label,
          },
          response: {
            userId: userId,
            userName: response.user.name,
            userEmail: response.user.email,
            actionValue: data.actionId,
            comment: data.comment,
            metadata: data.metadata,
            respondedAt: response.respondedAt.toISOString(),
          },
        };

        const secret = process.env.WEBHOOK_SECRET || 'default_secret';
        const signature = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');

        await axios.post(callbackUrl, payload, {
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Event': 'message.action_response',
            'X-Webhook-Signature': `sha256=${signature}`,
          },
        });

        await prisma.messageActionResponse.update({
          where: { id: response.id },
          data: { webhookSent: true },
        });
      } catch (webhookError) {
        console.error('Failed to send webhook callback:', webhookError);
      }
    }

    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId: message.channel.workspace?.id || '',
        userId: userId,
        action: 'message.action_responded',
        resource: 'message_action',
        resourceId: response.id,
        metadata: {
          messageId: message.id,
          actionId: data.actionId,
          channelId: message.channel.id,
        },
      },
    });

    return {
      success: true,
      response,
    };
  }

  async getActionResponses(messageId: string) {
    const responses = await prisma.messageActionResponse.findMany({
      where: { messageId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        action: true,
      },
      orderBy: { respondedAt: 'desc' },
    });

    return {
      success: true,
      responses,
    };
  }
}

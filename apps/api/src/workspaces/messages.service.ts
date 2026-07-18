import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { prisma } from '@repo/database';
import {
  AblyChannels,
  AblyEvents,
  publishRealtime,
  notifyMention,
  notifyMentions,
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
  private readonly logger = new Logger(MessagesService.name);

  // --- Core Validations ---
  async verifyWorkspaceAccess(userId: string, slug: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      select: {
        id: true,
        members: {
          where: { userId },
          select: { userId: true },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (workspace.members.length === 0) {
      throw new ForbiddenException('Forbidden');
    }

    return workspace;
  }
  async getMessages(channelId: string, userId: string, cursor?: string, limit = 50, threadId?: string) {
    if (!channelId) {
      throw new BadRequestException('Channel ID required');
    }

    const messages = await prisma.message.findMany({
      where: {
        channelId,
        threadId: threadId || null,
        ...(cursor ? { timestamp: { lt: new Date(cursor) } } : {}),
      },
      select: {
        id: true,
        channelId: true,
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
        _count: {
          select: {
            replies: true,
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

      // Standardize user object avatar and remove redundant image field to reduce payload size
      // while fully preserving all other user fields via spreading.
      const formattedUser = msg.user
        ? {
            ...msg.user,
            avatar: msg.user.avatar || msg.user.image,
            image: undefined,
          }
        : null;

      // Standardize replyTo user object if present while fully preserving all other fields via spreading.
      const formattedReplyTo = msg.replyTo
        ? {
            ...msg.replyTo,
            user: msg.replyTo.user
              ? {
                  ...msg.replyTo.user,
                  avatar: msg.replyTo.user.avatar || msg.replyTo.user.image,
                  image: undefined,
                }
              : null,
          }
        : null;

      return {
        ...msg,
        user: formattedUser,
        replyTo: formattedReplyTo,
        reactions: Array.from(reactionGroups.values()),
        mentions: msg.mentions.map(m => m.mention),
        readByCurrentUser: msg.readBy.length > 0,
        replyCount: msg._count.replies,
        // We keep replyTo as an object because the UI uses it for the 'replied to' header
        // while also keeping the ID available if needed.
        // Remove raw fields not needed in frontend
        readBy: undefined,
        _count: undefined,
      };
    });

    return {
      messages: formattedMessages,
      nextCursor,
      hasMore,
    };
  }

  async createMessage(userId: string, body: any) {
    const { channelId, content, messageType, metadata, replyToId, threadId, attachments, stickerId } = body;

    if (!channelId) {
      throw new BadRequestException('Channel ID required');
    }

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      select: {
        id: true,
        isPrivate: true,
        type: true,
        members: {
          where: { userId },
          select: { userId: true },
        },
      },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (channel.isPrivate || channel.type === 'private') {
      const isMember = channel.members.length > 0;
      if (!isMember) {
        throw new ForbiddenException('You do not have permission to send messages to this private channel');
      }
    }

    const userMentions = extractUserMentions(content || '');
    const channelMentions = extractChannelMentions(content || '');
    const mentionsAll = hasSpecialMention(content || '', 'all');
    const mentionsHere = hasSpecialMention(content || '', 'here');

    const [mentionedUsers, sticker] = await Promise.all([
      userMentions.length > 0
        ? prisma.user.findMany({
            where: { name: { in: userMentions, mode: 'insensitive' } },
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
      stickerId ? prisma.sticker.findUnique({ where: { id: stickerId } }) : Promise.resolve(null),
    ]);

    const mentionedUserIds = extractUserIds(userMentions, mentionedUsers);

    // Eligibility check for stickers
    if (stickerId && sticker) {
      if (sticker.rules) {
        const isEligible = await isUserEligibleForAsset(userId, sticker.rules);
        if (!isEligible) {
          throw new ForbiddenException('Not eligible to use this sticker');
        }
      }
      /**
       * ⚡ Performance Optimization:
       * Background the asset usage logging to avoid blocking message creation.
       */
      logAssetUsage({
        assetId: stickerId,
        assetType: 'sticker',
        userId: userId,
        workspaceId: sticker.workspaceId || undefined,
      }).catch(err => this.logger.error('Failed to log sticker usage:', err));
    }

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          channelId,
          userId: userId,
          content,
          messageType: messageType || 'standard',
          metadata: { ...metadata, stickerId },
          replyToId,
          threadId,
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
      }),
      prisma.user.update({
        where: { id: userId },
        data: { messageCount: { increment: 1 } },
      }),
    ]);

    const sender = (message as any).user;
    const recipientIds = mentionedUserIds.filter(id => id !== userId);

    await Promise.all([
      recipientIds.length > 0
        ? notifyMentions(message.id, recipientIds, sender?.name || 'Someone', channelId, content)
        : Promise.resolve(),
      mentionsAll || mentionsHere
        ? notifyChannel(channelId, sender?.name || 'Someone', message.id, content, mentionsHere)
        : Promise.resolve(),
      publishRealtime(AblyChannels.channel(channelId), AblyEvents.MESSAGE_SENT, message),
    ]).catch(err => this.logger.error('Failed to process message side effects:', err));

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

    /**
     * ⚡ Performance Optimization:
     * Background the realtime publishing to avoid blocking the update response.
     */
    publishRealtime(AblyChannels.channel(message.channelId), AblyEvents.MESSAGE_UPDATED, message).catch(err =>
      this.logger.error('Failed to publish message update:', err)
    );

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

    /**
     * ⚡ Performance Optimization:
     * Background the realtime publishing to avoid blocking the deletion response.
     */
    publishRealtime(AblyChannels.channel(channelId), AblyEvents.MESSAGE_DELETED, {
      id: messageId,
      channelId,
      threadId: existingMessage.rootThread?.id,
    }).catch(err => this.logger.error('Failed to publish message deletion:', err));

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
      select: {
        id: true,
        content: true,
        timestamp: true,
        channelId: true,
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

  async batchMarkAsRead(userId: string, messageIds: string[], channelId?: string) {
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

    let targetChannelId = channelId;
    if (!targetChannelId) {
      const firstMessage = await prisma.message.findUnique({
        where: { id: messageIds[0] },
        select: { channelId: true },
      });
      targetChannelId = firstMessage?.channelId;
    }

    if (targetChannelId) {
      /**
       * ⚡ Performance Optimization:
       * Background the realtime publishing to avoid blocking the read receipt response.
       */
      publishRealtime(AblyChannels.user(userId), AblyEvents.MESSAGE_READ, {
        channelId: targetChannelId,
        messageIds,
      }).catch(err => this.logger.error('Failed to publish message read event:', err));
    }

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

      /**
       * ⚡ Performance Optimization:
       * Background the asset usage logging to avoid blocking reaction addition.
       */
      logAssetUsage({
        assetId: customEmojiId,
        assetType: 'emoji',
        userId: userId,
        workspaceId: customEmoji?.workspaceId || undefined,
      }).catch(err => this.logger.error('Failed to log custom emoji usage:', err));
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
      include: {
        message: {
          select: {
            channelId: true,
          },
        },
      },
    });

    const channelId = (reaction as any).message.channelId;
    /**
     * ⚡ Performance Optimization:
     * Background the realtime publishing to avoid blocking the reaction addition response.
     */
    publishRealtime(AblyChannels.channel(channelId), AblyEvents.MESSAGE_REACTION, {
      messageId,
      reaction,
      action: 'add',
    }).catch(err => this.logger.error('Failed to publish reaction addition:', err));

    return reaction;
  }

  async removeReaction(userId: string, messageId: string, emoji: string) {
    try {
      const reaction = await prisma.reaction.delete({
        where: {
          messageId_userId_emoji: {
            messageId,
            userId,
            emoji,
          },
        },
        include: {
          message: {
            select: {
              channelId: true,
            },
          },
        },
      });

      const channelId = (reaction as any).message.channelId;
      /**
       * ⚡ Performance Optimization:
       * Background the realtime publishing to avoid blocking the reaction removal response.
       */
      publishRealtime(AblyChannels.channel(channelId), AblyEvents.MESSAGE_REACTION, {
        messageId,
        emoji,
        userId,
        action: 'remove',
      }).catch(err => this.logger.error('Failed to publish reaction removal:', err));
    } catch (error) {
      // Prisma error code for 'Record to delete does not exist'
      if ((error as any).code === 'P2025') {
        throw new NotFoundException('Reaction not found');
      }
      throw error;
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

    /**
     * ⚡ Performance Optimization:
     * Background non-critical side effects (Realtime, Webhooks, Audit Logs)
     * to minimize response latency for action processing.
     */
    publishRealtime(AblyChannels.channel(message.channel.id), 'message.action_response', {
      messageId: message.id,
      actionId: data.actionId,
      response,
    }).catch(err => this.logger.error('Failed to publish action response:', err));

    if (callbackUrl) {
      const dispatchWebhook = async () => {
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
      };

      dispatchWebhook().catch(err => this.logger.error('Failed to send webhook callback:', err));
    }

    prisma.workspaceAuditLog
      .create({
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
      })
      .catch(err => this.logger.error('Failed to create action response audit log:', err));

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

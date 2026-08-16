import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@repo/database';
import { AblyChannels, AblyEvents, publishRealtime } from '@repo/shared/server';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class DmsService {
  private readonly logger = new Logger(DmsService.name);

  constructor(private readonly notificationsService: NotificationsService) {}
  async getDms(userId: string) {
    const dms = await prisma.directMessage.findMany({
      where: {
        OR: [{ participant1Id: userId }, { participant2Id: userId }],
      },
      select: {
        id: true,
        participant1Id: true,
        participant2Id: true,
        lastMessageAt: true,
        participant1: {
          select: {
            id: true,
            name: true,
            avatar: true,
            image: true,
            status: true,
          },
        },
        participant2: {
          select: {
            id: true,
            name: true,
            avatar: true,
            image: true,
            status: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            content: true,
            createdAt: true,
            senderId: true,
          },
        },
        _count: {
          select: {
            messages: {
              where: {
                readBy: {
                  none: {
                    userId: userId,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
    });

    return dms.map(dm => {
      const participant1 = {
        ...dm.participant1,
        avatar: dm.participant1.avatar || dm.participant1.image,
      };
      const participant2 = {
        ...dm.participant2,
        avatar: dm.participant2.avatar || dm.participant2.image,
      };

      const otherUser = dm.participant1Id === userId ? participant2 : participant1;

      const lastMessage = dm.messages[0];

      return {
        id: dm.id,
        creatorId: dm.participant1Id,
        members: [participant1, participant2],
        user: otherUser,
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              createdAt: lastMessage.createdAt,
              timestamp: lastMessage.createdAt,
              userId: lastMessage.senderId,
            }
          : null,
        _count: {
          messages: dm._count.messages,
        },
        lastMessageAt: dm.lastMessageAt,
      };
    });
  }

  async getDm(conversationId: string, userId: string) {
    const dm = await prisma.directMessage.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        participant1Id: true,
        participant2Id: true,
        participant1: {
          select: { id: true, name: true, avatar: true, image: true, status: true },
        },
        participant2: {
          select: { id: true, name: true, avatar: true, image: true, status: true },
        },
      },
    });

    if (!dm) {
      return null;
    }

    const otherUser =
      dm.participant1Id === userId
        ? { ...dm.participant2, avatar: dm.participant2.avatar || dm.participant2.image }
        : { ...dm.participant1, avatar: dm.participant1.avatar || dm.participant1.image };

    return {
      id: dm.id,
      user: otherUser,
      members: [
        { ...dm.participant1, avatar: dm.participant1.avatar || dm.participant1.image },
        { ...dm.participant2, avatar: dm.participant2.avatar || dm.participant2.image },
      ],
    };
  }

  async createDm(userId: string, targetUserId: string, userName: string) {
    const [p1, p2] = [userId, targetUserId].sort();

    const dmSelect = {
      id: true,
      participant1Id: true,
      participant2Id: true,
      lastMessageAt: true,
      createdAt: true,
      updatedAt: true,
      participant1: {
        select: {
          id: true,
          name: true,
          avatar: true,
          image: true,
          status: true,
        },
      },
      participant2: {
        select: {
          id: true,
          name: true,
          avatar: true,
          image: true,
          status: true,
        },
      },
    };

    const dm = await prisma.directMessage.upsert({
      where: {
        participant1Id_participant2Id: {
          participant1Id: p1,
          participant2Id: p2,
        },
      },
      update: {}, // No updates needed for existing DM
      create: {
        participant1Id: p1,
        participant2Id: p2,
      },
      select: dmSelect,
    });

    const participant1 = {
      ...dm.participant1,
      avatar: dm.participant1.avatar || dm.participant1.image,
    };
    const participant2 = {
      ...dm.participant2,
      avatar: dm.participant2.avatar || dm.participant2.image,
    };

    const otherUser = dm.participant1Id === userId ? participant2 : participant1;

    const formattedDm = {
      ...dm,
      members: [participant1, participant2],
      creatorId: dm.participant1Id,
      user: otherUser,
      lastMessage: null,
      _count: {
        messages: 0,
      },
    };

    publishRealtime(AblyChannels.user(targetUserId), AblyEvents.DM_RECEIVED, {
      dmId: dm.id,
      from: userName,
    }).catch(err => this.logger.error('Failed to publish DM creation event:', err));

    return formattedDm;
  }

  async deleteDm(conversationId: string) {
    await prisma.directMessage.delete({
      where: { id: conversationId },
    });
    return { success: true };
  }

  async getMessages(dmId: string, userId: string, cursor?: string, limitNum = 50) {
    const messages = await prisma.dMMessage.findMany({
      where: {
        dmId,
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      select: {
        id: true,
        dmId: true,
        senderId: true,
        content: true,
        isEdited: true,
        replyToId: true,
        createdAt: true,
        updatedAt: true,
        sender: {
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
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limitNum + 1,
    });

    const hasMore = messages.length > limitNum;
    const rawData = hasMore ? messages.slice(0, limitNum) : messages;
    const nextCursor = hasMore ? rawData[rawData.length - 1].createdAt.toISOString() : null;

    const formattedMessages = rawData.map(m => {
      // Group reactions by emoji
      const reactionGroups = new Map<string, { emoji: string; count: number; users: string[] }>();
      m.reactions.forEach(r => {
        if (!reactionGroups.has(r.emoji)) {
          reactionGroups.set(r.emoji, { emoji: r.emoji, count: 0, users: [] });
        }
        const group = reactionGroups.get(r.emoji)!;
        group.count++;
        group.users.push(r.userId);
      });

      return {
        ...m,
        userId: m.senderId,
        user: {
          ...m.sender,
          avatar: m.sender.avatar || m.sender.image,
        },
        timestamp: m.createdAt,
        messageType: 'standard',
        reactions: Array.from(reactionGroups.values()),
        readByCurrentUser: m.readBy.length > 0,
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

  async createMessage(dmId: string, userId: string, body: any) {
    const { content, replyToId, attachments } = body;
    const [message, dm] = await prisma.$transaction([
      prisma.dMMessage.create({
        data: {
          dmId,
          senderId: userId,
          content,
          replyToId,
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
          sender: true,
          reactions: true,
          attachments: true,
        },
      }),
      prisma.directMessage.update({
        where: { id: dmId },
        data: { lastMessageAt: new Date() },
        select: {
          participant1Id: true,
          participant2Id: true,
        },
      }),
    ]);

    const formattedMessage = {
      ...message,
      userId: (message as any).senderId,
      user: (message as any).sender,
      timestamp: (message as any).createdAt,
      messageType: 'standard',
    };

    publishRealtime(AblyChannels.dm(dmId), AblyEvents.MESSAGE_SENT, formattedMessage).catch(err =>
      this.logger.error('Failed to publish DM message sent event:', err)
    );

    // Notify the other participant
    const recipientId = dm.participant1Id === userId ? dm.participant2Id : dm.participant1Id;
    if (recipientId) {
      this.notificationsService
        .notifyDM(dmId, userId, formattedMessage.user?.name || 'Someone', recipientId, formattedMessage.id, content)
        .catch(err => this.logger.error('Failed to send DM notification:', err));
    }

    return formattedMessage;
  }

  async updateMessage(dmId: string, messageId: string, userId: string, content: string) {
    const message = await prisma.dMMessage.update({
      where: { id: messageId },
      data: {
        content,
        isEdited: true,
      },
      include: {
        sender: true,
        reactions: true,
        attachments: true,
      },
    });

    const formattedMessage = {
      ...message,
      userId: message.senderId,
      user: message.sender,
      timestamp: message.createdAt,
      messageType: 'standard',
    };

    publishRealtime(AblyChannels.dm(dmId), AblyEvents.MESSAGE_UPDATED, formattedMessage).catch(err =>
      this.logger.error('Failed to publish DM message update:', err)
    );

    return formattedMessage;
  }

  async deleteMessage(dmId: string, messageId: string) {
    await prisma.dMMessage.delete({
      where: { id: messageId },
    });
    publishRealtime(AblyChannels.dm(dmId), AblyEvents.MESSAGE_DELETED, { id: messageId }).catch(err =>
      this.logger.error('Failed to publish DM message deletion:', err)
    );

    return { success: true };
  }

  async markAsRead(userId: string, messageIds: string[], dmId?: string) {
    if (!messageIds.length) return { success: true };

    await prisma.dMMessageRead.createMany({
      data: messageIds.map(messageId => ({
        messageId,
        userId,
        readAt: new Date(),
      })),
      skipDuplicates: true,
    });

    let targetDmId = dmId;
    if (!targetDmId) {
      const firstMessage = await prisma.dMMessage.findUnique({
        where: { id: messageIds[0] },
        select: { dmId: true },
      });
      targetDmId = firstMessage?.dmId;
    }

    if (targetDmId) {
      publishRealtime(AblyChannels.user(userId), AblyEvents.MESSAGE_READ, {
        dmId: targetDmId,
        messageIds,
      }).catch(err => this.logger.error('Failed to publish DM message read event:', err));
    }

    return { success: true };
  }

  async addReaction(dmId: string, messageId: string, userId: string, emoji: string) {
    const reaction = await prisma.dMReaction.upsert({
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

    /**
     * ⚡ Performance Optimization:
     * Background the realtime publishing to avoid blocking the reaction addition response.
     */
    publishRealtime(AblyChannels.dm(dmId), AblyEvents.MESSAGE_REACTION, {
      messageId,
      reaction,
      action: 'add',
    }).catch(err => this.logger.error('Failed to publish DM reaction addition:', err));

    return reaction;
  }

  async removeReaction(dmId: string, messageId: string, userId: string, emoji: string) {
    /**
     * ⚡ Performance Optimization:
     * Replaces sequential 'findUnique' and 'delete' with a single atomic 'delete' using the
     * compound unique index. This reduces database round-trips from 2 down to 1.
     * Expected impact: Faster reaction removal and reduced database load.
     */
    try {
      await prisma.dMReaction.delete({
        where: {
          messageId_userId_emoji: {
            messageId,
            userId,
            emoji,
          },
        },
      });

      /**
       * ⚡ Performance Optimization:
       * Background the realtime publishing to avoid blocking the reaction removal response.
       */
      publishRealtime(AblyChannels.dm(dmId), AblyEvents.MESSAGE_REACTION, {
        messageId,
        emoji,
        userId,
        action: 'remove',
      }).catch(err => this.logger.error('Failed to publish DM reaction removal:', err));
    } catch (error) {
      // Prisma error code for 'Record to delete does not exist' - we ignore it here
      // to maintain idempotency and match previous behavior.
      if ((error as any).code !== 'P2025') {
        throw error;
      }
    }

    return { success: true };
  }
}

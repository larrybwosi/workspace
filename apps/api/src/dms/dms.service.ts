import { Injectable } from '@nestjs/common';
import { prisma } from '@repo/database';
import { getAblyRest, AblyChannels, AblyEvents, publishToAbly } from '@repo/shared/server';

@Injectable()
export class DmsService {
  async getDms(userId: string) {
    const dms = await prisma.directMessage.findMany({
      where: {
        OR: [
          { participant1Id: userId },
          { participant2Id: userId },
        ],
      },
      include: {
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
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                avatar: true,
                image: true,
              }
            }
          }
        },
        _count: {
          select: {
            messages: {
              where: {
                readBy: {
                  none: {
                    userId: userId,
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        lastMessageAt: "desc",
      },
    });

    return dms.map((dm) => {
      const participant1 = {
        ...dm.participant1,
        avatar: dm.participant1.avatar || dm.participant1.image
      };
      const participant2 = {
        ...dm.participant2,
        avatar: dm.participant2.avatar || dm.participant2.image
      };

      const otherUser =
        dm.participant1Id === userId
          ? participant2
          : participant1;

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
      include: {
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
    let dm = await prisma.directMessage.findFirst({
      where: {
        OR: [
          { participant1Id: userId, participant2Id: targetUserId },
          { participant1Id: targetUserId, participant2Id: userId },
        ],
      },
      include: {
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
      },
    });

    if (!dm) {
      dm = await prisma.directMessage.create({
        data: {
          participant1Id: userId,
          participant2Id: targetUserId,
        },
        include: {
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
        },
      });
    }

    const participant1 = {
      ...dm.participant1,
      avatar: dm.participant1.avatar || dm.participant1.image
    };
    const participant2 = {
      ...dm.participant2,
      avatar: dm.participant2.avatar || dm.participant2.image
    };

    const formattedDm = {
      ...dm,
      members: [participant1, participant2],
      creatorId: dm.participant1Id,
    };

    await publishToAbly(AblyChannels.user(targetUserId), AblyEvents.DM_RECEIVED, {
      dmId: dm.id,
      from: userName,
    });

    return formattedDm;
  }

  async deleteDm(conversationId: string) {
    await prisma.directMessage.delete({
      where: { id: conversationId },
    });
    return { success: true };
  }

  async getMessages(dmId: string, cursor?: string, limitNum = 50) {
    const messages = await prisma.dMMessage.findMany({
      where: {
        dmId,
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      include: {
        sender: true,
        reactions: true,
        attachments: true,
        readBy: true,
        replyTo: {
          include: {
            sender: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limitNum + 1,
    });

    const hasMore = messages.length > limitNum;
    const data = hasMore ? messages.slice(0, limitNum) : messages;
    const nextCursor = hasMore ? data[data.length - 1].createdAt.toISOString() : null;

    // Map fields for compatibility with UI Message type
    const formattedMessages = data.reverse().map(m => ({
      ...m,
      userId: m.senderId,
      user: m.sender,
      timestamp: m.createdAt,
      messageType: 'standard', // DMs are usually standard
    }));

    return {
      messages: formattedMessages,
      nextCursor,
      hasMore,
    };
  }

  async createMessage(dmId: string, userId: string, body: any) {
    const { content, replyToId, attachments } = body;

    const message = await prisma.dMMessage.create({
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
    });

    await prisma.directMessage.update({
      where: { id: dmId },
      data: { lastMessageAt: new Date() },
    });

    const formattedMessage = {
      ...message,
      userId: message.senderId,
      user: message.sender,
      timestamp: message.createdAt,
      messageType: 'standard',
    };

    const ably = getAblyRest();
    if (ably) {
      const channel = ably.channels.get(AblyChannels.channel(dmId));
      await channel.publish(AblyEvents.MESSAGE_SENT, formattedMessage);
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

    const ably = getAblyRest();
    if (ably) {
      const channel = ably.channels.get(AblyChannels.channel(dmId));
      await channel.publish(AblyEvents.MESSAGE_UPDATED, formattedMessage);
    }

    return formattedMessage;
  }

  async deleteMessage(dmId: string, messageId: string) {
    await prisma.dMMessage.delete({
      where: { id: messageId },
    });

    const ably = getAblyRest();
    if (ably) {
      const channel = ably.channels.get(AblyChannels.channel(dmId));
      await channel.publish(AblyEvents.MESSAGE_DELETED, { id: messageId });
    }

    return { success: true };
  }

  async markAsRead(userId: string, messageIds: string[]) {
    const readPromises = messageIds.map((messageId) =>
      prisma.dMMessageRead.upsert({
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

    const ably = getAblyRest();
    if (ably) {
      const channel = ably.channels.get(AblyChannels.channel(dmId));
      await channel.publish(AblyEvents.MESSAGE_REACTION, { messageId, reaction, action: 'add' });
    }

    return reaction;
  }

  async removeReaction(dmId: string, messageId: string, userId: string, emoji: string) {
    const reaction = await prisma.dMReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji,
        },
      },
    });

    if (reaction) {
      await prisma.dMReaction.delete({
        where: { id: reaction.id },
      });

      const ably = getAblyRest();
      if (ably) {
        const channel = ably.channels.get(AblyChannels.channel(dmId));
        await channel.publish(AblyEvents.MESSAGE_REACTION, { messageId, emoji, userId, action: 'remove' });
      }
    }

    return { success: true };
  }
}

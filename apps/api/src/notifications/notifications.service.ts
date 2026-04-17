import { Injectable } from '@nestjs/common';
import { prisma } from '@repo/database';
import { getAblyRest, AblyChannels, AblyEvents, sendPushNotification } from '@repo/shared/server';

export interface NotificationPayload {
  userId: string;
  type: 'mention' | 'system' | 'channel_alert' | 'workspace_alert' | 'workspace_invitation' | 'platform_invitation';
  title: string;
  message: string;
  entityType?: 'channel' | 'workspace' | 'direct_message' | 'invitation';
  entityId?: string;
  linkUrl?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  async getNotifications(userId: string, unreadOnly = false, limit = 50) {
    return prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly && { isRead: false }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  async createNotification(payload: NotificationPayload) {
    // Create notification in database
    const notification = await prisma.notification.create({
      data: {
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        entityType: payload.entityType,
        entityId: payload.entityId,
        linkUrl: payload.linkUrl,
        metadata: payload.metadata,
      },
    });

    // Send external notifications (real-time and push)
    await this.deliverNotifications([{
      id: notification.id,
      userId: notification.userId,
      createdAt: notification.createdAt,
      payload
    }]);

    return notification;
  }

  /**
   * ⚡ Performance Optimization:
   * Shared delivery logic for both single and batch notifications.
   * Parallelizes Ably and Push notification delivery for multiple notifications.
   */
  private async deliverNotifications(notifications: Array<{
    id: string;
    userId: string;
    createdAt: Date;
    payload: NotificationPayload;
  }>) {
    const ably = getAblyRest();

    const deliveryPromises = notifications.map(async ({ id, userId, createdAt, payload }) => {
      // 1. Send real-time notification via Ably
      const ablyPromise = ably
        ? ably.channels.get(AblyChannels.notifications(userId)).publish(AblyEvents.NOTIFICATION, {
            id,
            ...payload,
            createdAt,
          })
        : Promise.resolve();

      // 2. Send push notification
      const pushPromise = sendPushNotification({
        userId,
        title: payload.title,
        body: payload.message,
        data: {
          type: payload.type,
          entityType: payload.entityType || '',
          entityId: payload.entityId || '',
        },
        linkUrl: payload.linkUrl || undefined,
        notificationId: id,
      }).catch(err => {
        console.error(`Push notification failed for user ${userId}:`, err);
      });

      return Promise.all([ablyPromise, pushPromise]);
    });

    // Execute all deliveries in parallel and await them to ensure reliability
    try {
      await Promise.all(deliveryPromises);
    } catch (err) {
      console.error('Batch notification delivery failed partially:', err);
    }
  }

  async notifyMention(
    messageId: string,
    mentionedUserId: string,
    mentionedBy: string,
    channelId: string,
    messageContent: string
  ) {
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        workspace: true,
        members: {
          where: { userId: mentionedUserId },
        },
      },
    });

    if (!channel) return;

    // Check preferences
    const workspaceId = channel.workspaceId;
    const channelMember = channel.members[0];

    let preference = channelMember?.notificationPreference;

    if (!preference && workspaceId) {
      const workspaceMember = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: mentionedUserId } },
      });
      preference = workspaceMember?.notificationPreference || 'all';
    }

    if (preference === 'nothing') return;

    const workspaceSlug = channel?.workspace?.slug || 'default';
    const channelSlug = channel?.slug || channelId;

    await this.createNotification({
      userId: mentionedUserId,
      type: 'mention',
      title: 'You were mentioned',
      message: `${mentionedBy} mentioned you in #${channel?.name || 'a channel'}`,
      entityType: 'channel',
      entityId: channelId,
      linkUrl: `/workspace/${workspaceSlug}/channels/${channelSlug}?messageId=${messageId}`,
      metadata: {
        messageContent: messageContent.slice(0, 100),
        mentionedBy,
        channelName: channel?.name,
        messageId,
      },
    });
  }

  async notifyChannel(
    channelId: string,
    sentBy: string,
    messageId: string,
    messageContent: string,
    isHere: boolean = false
  ) {
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        members: {
          select: {
            userId: true,
            notificationPreference: true,
          },
        },
        workspace: {
          select: {
            id: true,
            slug: true,
          },
        },
      },
    });

    if (!channel) return;

    const workspaceSlug = channel.workspace?.slug || 'default';
    const channelSlug = channel.slug || channelId;
    const channelMembers = channel.members;

    // ⚡ Optimization: Fetch all workspace-level preferences in one go to avoid O(N*M) lookups
    const membersNeedsWorkspacePref = channelMembers
      .filter(cm => !cm.notificationPreference)
      .map(cm => cm.userId);

    const workspacePrefsMap = new Map<string, string>();
    if (channel.workspaceId && membersNeedsWorkspacePref.length > 0) {
      const workspaceMembers = await prisma.workspaceMember.findMany({
        where: {
          workspaceId: channel.workspaceId,
          userId: { in: membersNeedsWorkspacePref },
        },
        select: {
          userId: true,
          notificationPreference: true,
        },
      });
      for (const wm of workspaceMembers) {
        workspacePrefsMap.set(wm.userId, wm.notificationPreference);
      }
    }

    const notificationData = channelMembers
      .map(cm => {
        const userId = cm.userId;
        const preference = cm.notificationPreference || workspacePrefsMap.get(userId) || 'all';

        if (preference === 'nothing') return null;

        return {
          userId,
          type: 'channel_alert' as const,
          title: isHere ? `@here in #${channel.name}` : `@all in #${channel.name}`,
          message: `${sentBy}: ${messageContent.slice(0, 50)}...`,
          entityType: 'channel' as const,
          entityId: channelId,
          linkUrl: `/workspace/${workspaceSlug}/channels/${channelSlug}?messageId=${messageId}`,
          metadata: {
            messageId,
            sentBy,
          },
        };
      })
      .filter((n): n is NonNullable<typeof n> => n !== null);

    if (notificationData.length === 0) return;

    // ⚡ Optimization: Batch insert notifications to avoid sequential database round-trips
    // Uses createManyAndReturn (Prisma 5.14.0+) to get IDs for real-time delivery
    const notifications = await prisma.notification.createManyAndReturn({
      data: notificationData,
    });

    // ⚡ Optimization: Deliver external notifications in parallel
    await this.deliverNotifications(notifications.map((n, i) => ({
      id: n.id,
      userId: n.userId,
      createdAt: n.createdAt,
      payload: notificationData[i]
    })));
  }

  async markAllRead(userId: string) {
    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
    return { success: true };
  }

  async updateNotification(userId: string, notificationId: string, isRead: boolean) {
    return prisma.notification.update({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        isRead: isRead !== undefined ? isRead : true,
      },
    });
  }

  async deleteNotification(userId: string, notificationId: string) {
    await prisma.notification.delete({
      where: {
        id: notificationId,
        userId,
      },
    });
    return { success: true };
  }

  async getWorkspaceSettings(userId: string, workspaceId: string) {
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
      select: {
        notificationPreference: true,
      },
    });
    return member || { notificationPreference: 'all' };
  }

  async updateWorkspaceSettings(userId: string, workspaceId: string, preference: string) {
    return prisma.workspaceMember.update({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
      data: {
        notificationPreference: preference,
      },
    });
  }

  async getChannelSettings(userId: string, channelId: string) {
    const member = await prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
      select: {
        notificationPreference: true,
      },
    });
    return member || { notificationPreference: null };
  }

  async updateChannelSettings(userId: string, channelId: string, preference: string) {
    return prisma.channelMember.update({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
      data: {
        notificationPreference: preference,
      },
    });
  }
}

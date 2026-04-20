import { Injectable } from '@nestjs/common';
import { prisma } from '@repo/database';
import {
  getAblyRest,
  AblyChannels,
  AblyEvents,
  sendPushNotification,
  notifyMention as sharedNotifyMention,
  notifyMentions as sharedNotifyMentions,
  notifyChannel as sharedNotifyChannel,
} from '@repo/shared/server';

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

  /**
   * ⚡ Performance Optimization:
   * Delegated to shared implementation for consistent optimization across the platform.
   */
  async notifyMention(
    messageId: string,
    mentionedUserId: string,
    mentionedBy: string,
    channelId: string,
    messageContent: string
  ) {
    return sharedNotifyMention(messageId, mentionedUserId, mentionedBy, channelId, messageContent);
  }

  /**
   * ⚡ Performance Optimization:
   * Batched implementation to avoid N+1 database queries and sequential external deliveries.
   */
  async notifyMentions(
    messageId: string,
    mentionedUserIds: string[],
    mentionedBy: string,
    channelId: string,
    messageContent: string
  ) {
    return sharedNotifyMentions(messageId, mentionedUserIds, mentionedBy, channelId, messageContent);
  }

  /**
   * ⚡ Performance Optimization:
   * Delegated to shared implementation for consistent optimization across the platform.
   */
  async notifyChannel(
    channelId: string,
    sentBy: string,
    messageId: string,
    messageContent: string,
    isHere: boolean = false
  ) {
    return sharedNotifyChannel(channelId, sentBy, messageId, messageContent, isHere);
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

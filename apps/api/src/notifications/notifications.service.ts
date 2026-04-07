import { Injectable } from '@nestjs/common';
import { prisma } from '@repo/database';
import { getAblyRest, AblyChannels, AblyEvents } from '../lib/integrations/ably';
import { sendPushNotification } from '../lib/notifications/push-notifications';

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

    // Send real-time notification via Ably
    const ably = getAblyRest();
    if (ably) {
      const channel = ably.channels.get(AblyChannels.notifications(payload.userId));

      await channel.publish(AblyEvents.NOTIFICATION, {
        id: notification.id,
        ...payload,
        createdAt: notification.createdAt,
      });
    }

    try {
      await sendPushNotification({
        userId: payload.userId,
        title: payload.title,
        body: payload.message,
        data: {
          type: payload.type,
          entityType: payload.entityType || '',
          entityId: payload.entityId || '',
        },
        linkUrl: payload.linkUrl,
        notificationId: notification.id,
      });
    } catch (error) {
      console.error(' Push notification error:', error);
      // Don't fail the whole operation if push notifications fail
    }

    return notification;
  }
}

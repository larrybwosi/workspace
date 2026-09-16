import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { prisma } from '@repo/database';
import {
  AblyChannels,
  AblyEvents,
  publishRealtime,
  queueNotification,
  notifyMention as sharedNotifyMention,
  notifyMentions as sharedNotifyMentions,
  notifyChannel as sharedNotifyChannel,
  notifyDM as sharedNotifyDM,
  notifyNewMessage as sharedNotifyNewMessage,
  notifyReply as sharedNotifyReply,
} from '@repo/shared/server';

export interface NotificationPayload {
  userId: string;
  type:
    | 'mention'
    | 'system'
    | 'channel_alert'
    | 'workspace_alert'
    | 'workspace_invitation'
    | 'platform_invitation'
    | 'direct_message';
  title: string;
  message: string;
  entityType?: 'channel' | 'workspace' | 'direct_message' | 'invitation';
  entityId?: string;
  linkUrl?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
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

  async getNotificationById(userId: string, notificationId: string) {
    /**
     * ⚡ Performance Optimization:
     * Leverages direct O(1) primary key lookup on 'id' via `findUnique` instead of slower `findFirst` index scan,
     * handling ownership check in application memory.
     */
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      return null;
    }

    return notification;
  }

  /**
   * ⚡ Performance Optimization:
   * Deliver real-time and push notifications.
   * This is used for individual ad-hoc notifications.
   * For batch delivery, prefer using the optimized shared functions.
   */
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

    // Send real-time notification
    await publishRealtime(AblyChannels.notifications(payload.userId), AblyEvents.NOTIFICATION, {
      id: notification.id,
      ...payload,
      createdAt: notification.createdAt,
    });

    try {
      await queueNotification({
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
      this.logger.error('Push notification queue error:', error);
      // Don't fail the whole operation if push notifications fail
    }

    return notification;
  }

  /**
   * ⚡ Performance Optimization:
   * Delegates mention notifications to the optimized shared implementation.
   * This ensures O(1) database round-trips for preference resolution and batch delivery.
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
   * Delegates batch mention notifications to the optimized shared implementation.
   * Reduces database round-trips from O(N) to O(1).
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
   * Delegates channel-wide notifications to the optimized shared implementation.
   * Eliminates expensive nested 'include' and enables batch notification creation.
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

  /**
   * Notify all channel members about a new message.
   */
  async notifyNewMessage(
    channelId: string,
    senderId: string,
    senderName: string,
    messageId: string,
    content: string,
    excludedUserIds: string[] = []
  ) {
    return sharedNotifyNewMessage(channelId, senderId, senderName, messageId, content, excludedUserIds);
  }

  /**
   * Notify a recipient about a new direct message.
   */
  async notifyDM(
    dmId: string,
    senderId: string,
    senderName: string,
    recipientId: string,
    messageId: string,
    content: string
  ) {
    return sharedNotifyDM(dmId, senderId, senderName, recipientId, messageId, content);
  }

  /**
   * Notify the author of a message when someone replies to it.
   */
  async notifyReply(
    channelId: string,
    replyAuthorId: string,
    replyAuthorName: string,
    parentMessageId: string,
    replyMessageId: string,
    content: string
  ) {
    return sharedNotifyReply(
      channelId,
      replyAuthorId,
      replyAuthorName,
      parentMessageId,
      replyMessageId,
      content
    );
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
    /**
     * Security Mitigation (BOLA / IDOR Protection):
     * Verify that the notification exists and belongs to the requesting user before performing the update.
     */
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: isRead !== undefined ? isRead : true,
      },
    });
  }

  async deleteNotification(userId: string, notificationId: string) {
    /**
     * Security Mitigation (BOLA / IDOR Protection):
     * Verify that the notification exists and belongs to the requesting user before performing deletion.
     */
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });
    return { success: true };
  }

  async getWorkspaceSettings(userId: string, workspaceId: string) {
    /**
     * Security Mitigation (BOLA / IDOR Protection):
     * Verify workspace membership before returning notification settings.
     */
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

    if (!member) {
      throw new NotFoundException('Workspace member not found');
    }

    return member;
  }

  async updateWorkspaceSettings(userId: string, workspaceId: string, preference: string) {
    /**
     * Security Mitigation (BOLA / IDOR Protection):
     * Verify workspace membership before updating settings.
     */
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Workspace member not found');
    }

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
    /**
     * Security Mitigation (BOLA / IDOR Protection):
     * Verify channel membership before returning notification settings.
     */
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

    if (!member) {
      throw new NotFoundException('Channel member not found');
    }

    return member;
  }

  async updateChannelSettings(userId: string, channelId: string, preference: string) {
    /**
     * Security Mitigation (BOLA / IDOR Protection):
     * Verify channel membership before updating notification settings.
     */
    const member = await prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Channel member not found');
    }

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

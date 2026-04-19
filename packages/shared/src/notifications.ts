import { prisma } from '@repo/database';
import { AblyChannels, AblyEvents } from './ably';
import { getAblyRest } from './ably.server';
import { sendPushNotification } from './push-notifications';

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

/**
 * ⚡ Performance Optimization:
 * Shared delivery logic for both single and batch notifications.
 * Parallelizes Ably and Push notification delivery for multiple notifications.
 * Expected impact: Reduces sequential network latency by O(N).
 */
async function deliverNotifications(notifications: Array<{
  id: string;
  userId: string;
  createdAt: Date;
  payload: NotificationPayload;
}>) {
  const ably = getAblyRest();

  const deliveryPromises = notifications.map(async ({ id, userId, createdAt, payload }) => {
    // 1. Send real-time notification via Ably
    const ablyPromise = ably
      ? (ably as any).channels.get(AblyChannels.notifications(userId)).publish(AblyEvents.NOTIFICATION, {
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
      linkUrl: payload.linkUrl,
      notificationId: id,
    }).catch(err => {
      console.error(`Push notification failed for user ${userId}:`, err);
    });

    return Promise.all([ablyPromise, pushPromise]);
  });

  try {
    await Promise.all(deliveryPromises);
  } catch (err) {
    console.error('Batch notification delivery failed partially:', err);
  }
}

export async function createNotification(payload: NotificationPayload) {
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

  // ⚡ Optimization: Deliver external notifications in parallel
  await deliverNotifications([{
    id: notification.id,
    userId: notification.userId,
    createdAt: notification.createdAt,
    payload
  }]);

  return notification;
}

export async function createSystemMessage(channelId: string, content: string, metadata?: Record<string, any>) {
  // Create system message in database
  const message = await prisma.message.create({
    data: {
      channelId,
      userId: 'system',
      content,
      messageType: 'system',
      metadata,
    },
    include: {
      user: true,
    },
  });

  // Broadcast via Ably
  const ably = getAblyRest();
  if (ably) {
    const channel = (ably as any).channels.get(AblyChannels.thread(channelId));
    await channel.publish(AblyEvents.MESSAGE_SENT, message);
  }

  return message;
}

/**
 * ⚡ Performance Optimization:
 * 1. Uses targeted 'select' to fetch only required fields from channel and workspace.
 * Expected impact: Reduces DB payload and memory usage.
 */
export async function notifyMention(
  messageId: string,
  mentionedUserId: string,
  mentionedBy: string,
  channelId: string,
  messageContent: string
) {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    select: {
      id: true,
      name: true,
      slug: true,
      workspaceId: true,
      workspace: {
        select: {
          slug: true,
        },
      },
      members: {
        where: { userId: mentionedUserId },
        select: {
          notificationPreference: true,
        },
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
      select: {
        notificationPreference: true,
      },
    });
    preference = workspaceMember?.notificationPreference || 'all';
  }

  if (preference === 'nothing') return;

  const workspaceSlug = channel?.workspace?.slug || 'default';
  const channelSlug = channel?.slug || channelId;

  await createNotification({
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

/**
 * ⚡ Performance Optimization:
 * 1. Replaces sequential database writes with batch 'createManyAndReturn'.
 * 2. Optimized preference lookups using a Map (O(N+M)) and targeted queries.
 * 3. Delivers external notifications (Ably/Push) in parallel.
 * Expected impact: Reduces database round-trips by O(N) and network latency by O(N).
 */
export async function notifyChannel(
  channelId: string,
  sentBy: string,
  messageId: string,
  messageContent: string,
  isHere: boolean = false
) {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    select: {
      id: true,
      name: true,
      slug: true,
      workspaceId: true,
      workspace: {
        select: {
          slug: true,
        },
      },
      members: {
        select: {
          userId: true,
          notificationPreference: true,
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
  // Prisma doesn't guarantee the order of returned records matches input order.
  // We use a Map to reliably link payloads to returned notifications.
  const payloadMap = new Map(notificationData.map(p => [p.userId, p]));

  await deliverNotifications(notifications.map(n => ({
    id: n.id,
    userId: n.userId,
    createdAt: n.createdAt,
    payload: payloadMap.get(n.userId)!
  })));
}

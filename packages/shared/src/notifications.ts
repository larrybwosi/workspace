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

  // Send real-time notification via Ably
  const ably = getAblyRest();
  if (ably) {
    const channel = (ably as any).channels.get(AblyChannels.notifications(payload.userId));

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

export async function notifyMention(
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

export async function notifyChannel(
  channelId: string,
  sentBy: string,
  messageId: string,
  messageContent: string,
  isHere: boolean = false
) {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    include: {
      members: true,
      workspace: {
        include: {
          members: true,
        },
      },
    },
  });

  if (!channel) return;

  const workspaceSlug = channel.workspace?.slug || 'default';
  const channelSlug = channel.slug || channelId;
  const channelMembers = channel.members;

  for (const cm of channelMembers) {
    const userId = cm.userId;

    // Check preferences
    let preference = cm.notificationPreference;
    if (!preference && channel.workspaceId) {
      const wm = channel.workspace?.members.find(m => m.userId === userId);
      preference = wm?.notificationPreference || 'all';
    }

    if (preference === 'nothing') continue;

    await createNotification({
      userId,
      type: 'channel_alert',
      title: isHere ? `@here in #${channel.name}` : `@all in #${channel.name}`,
      message: `${sentBy}: ${messageContent.slice(0, 50)}...`,
      entityType: 'channel',
      entityId: channelId,
      linkUrl: `/workspace/${workspaceSlug}/channels/${channelSlug}?messageId=${messageId}`,
      metadata: {
        messageId,
        sentBy,
      },
    });
  }
}

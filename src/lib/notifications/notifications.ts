import { prisma } from "@/lib/db/prisma"
import { getAblyRest, AblyChannels, AblyEvents } from "@/lib/integrations/ably"
import { sendPushNotification } from "@/lib/notifications/push-notifications"

export interface NotificationPayload {
  userId: string
  type: "mention" | "system" | "channel_alert" | "workspace_alert"
  title: string
  message: string
  entityType?: "channel" | "workspace" | "direct_message"
  entityId?: string
  linkUrl?: string
  metadata?: Record<string, any>
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
  })

  // Send real-time notification via Ably
  const ably = getAblyRest()
  if (ably) {
    const channel = ably.channels.get(AblyChannels.notifications(payload.userId))

    await channel.publish(AblyEvents.NOTIFICATION, {
      id: notification.id,
      ...payload,
      createdAt: notification.createdAt,
    })
  }

  try {
    await sendPushNotification({
      userId: payload.userId,
      title: payload.title,
      body: payload.message,
      data: {
        type: payload.type,
        entityType: payload.entityType || "",
        entityId: payload.entityId || "",
      },
      linkUrl: payload.linkUrl,
      notificationId: notification.id,
    })
  } catch (error) {
    console.error(" Push notification error:", error)
    // Don't fail the whole operation if push notifications fail
  }

  return notification
}

export async function createSystemMessage(channelId: string, content: string, metadata?: Record<string, any>) {
  // Create system message in database
  const message = await prisma.message.create({
    data: {
      channelId,
      userId: "system",
      content,
      messageType: "system",
      metadata,
    },
    include: {
      user: true,
    },
  })

  // Broadcast via Ably
  const ably = getAblyRest()
  if (ably) {
    const channel = ably.channels.get(AblyChannels.thread(channelId))

    await channel.publish(AblyEvents.MESSAGE_SENT, message)
  }

  return message
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
    include: { workspace: true }
  })

  const workspaceSlug = channel?.workspace?.slug || "default";
  const channelSlug = channel?.slug || channelId;

  await createNotification({
    userId: mentionedUserId,
    type: "mention",
    title: "You were mentioned",
    message: `${mentionedBy} mentioned you in #${channel?.name || "a channel"}`,
    entityType: "channel",
    entityId: channelId,
    linkUrl: `/workspace/${workspaceSlug}/channels/${channelSlug}?messageId=${messageId}`,
    metadata: {
      messageContent: messageContent.slice(0, 100),
      mentionedBy,
      channelName: channel?.name,
      messageId,
    },
  })
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
      workspace: true
    },
  })

  if (!channel) return

  const workspaceSlug = channel.workspace?.slug || "default";
  const channelSlug = channel.slug || channelId;
  const memberIds = channel.members.map((m) => m.userId)

  for (const userId of memberIds) {
    // For @here, we would ideally check if the user is online, but for now, we notify everyone in the channel.
    await createNotification({
      userId,
      type: "channel_alert",
      title: isHere ? `@here in #${channel.name}` : `@all in #${channel.name}`,
      message: `${sentBy}: ${messageContent.slice(0, 50)}...`,
      entityType: "channel",
      entityId: channelId,
      linkUrl: `/workspace/${workspaceSlug}/channels/${channelSlug}?messageId=${messageId}`,
      metadata: {
        messageId,
        sentBy,
      },
    })
  }
}

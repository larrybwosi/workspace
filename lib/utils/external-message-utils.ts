import { prisma } from "@/lib/db/prisma"
import { getAblyRest, AblyChannels, AblyEvents } from "@/lib/integrations/ably"
import crypto from "crypto"

export interface ExternalMessage {
  content: string
  messageType?: "standard" | "system" | "bot" | "integration" | "alert" | "announcement"
  metadata?: Record<string, any>
  attachments?: Array<{
    name: string
    type: string
    url: string
    size?: number
  }>
  embeds?: Array<{
    title?: string
    description?: string
    url?: string
    color?: string
    thumbnail?: string
    fields?: Array<{ name: string; value: string; inline?: boolean }>
    footer?: string
    timestamp?: string
  }>
  source?: {
    name: string
    icon?: string
    url?: string
  }
  priority?: "low" | "normal" | "high" | "urgent"
  expiresAt?: string
  silent?: boolean
}

export interface ExternalMessageResult {
  id: string
  channelId: string
  threadId: string
  content: string
  messageType: string
  timestamp: string
  metadata: any
}

/**
 * Create a message from an external source
 */
export async function createExternalMessage(
  channelId: string,
  userId: string,
  message: ExternalMessage,
  apiKeyId: string,
): Promise<ExternalMessageResult> {
  // Find or create the general thread for the channel
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
  })

  if (!channel) {
    throw new Error("Channel not found")
  }

  let thread = await prisma.thread.findFirst({
    where: {
      channelId,
      title: `${channel.name} General`,
    },
  })

  if (!thread) {
    thread = await prisma.thread.create({
      data: {
        channelId,
        title: `${channel.name} General`,
        creatorId: userId,
        status: "Active",
      },
    })
  }

  // Build message metadata with external source info
  const metadata = {
    ...message.metadata,
    external: true,
    apiKeyId,
    source: message.source,
    embeds: message.embeds,
    priority: message.priority || "normal",
    expiresAt: message.expiresAt,
  }

  // Create the message
  const newMessage = await prisma.message.create({
    data: {
      threadId: thread.id,
      userId,
      content: message.content,
      messageType: message.messageType || "integration",
      metadata,
      attachments: message.attachments
        ? {
            create: message.attachments.map((att) => ({
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
      attachments: true,
    },
  })

  // Publish to Ably for real-time updates (unless silent)
  if (!message.silent) {
    const ably = getAblyRest()
    const ablyChannel = ably.channels.get(AblyChannels.channel(channelId))
    await ablyChannel.publish(AblyEvents.MESSAGE_SENT, {
      ...newMessage,
      isExternal: true,
      source: message.source,
    })
  }

  // Log the API usage
  await prisma.apiKey.update({
    where: { id: apiKeyId },
    data: { lastUsedAt: new Date() },
  })

  return {
    id: newMessage.id,
    channelId,
    threadId: thread.id,
    content: newMessage.content,
    messageType: newMessage.messageType,
    timestamp: newMessage.timestamp.toISOString(),
    metadata: newMessage.metadata,
  }
}

/**
 * Validate channel access for API key
 */
export async function validateChannelAccess(
  channelId: string,
  userId: string,
): Promise<{ valid: boolean; error?: string }> {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    include: {
      members: {
        where: { userId },
      },
    },
  })

  if (!channel) {
    return { valid: false, error: "Channel not found" }
  }

  // Check if private channel and user is member
  if (channel.isPrivate && channel.members.length === 0) {
    return { valid: false, error: "Access denied to private channel" }
  }

  return { valid: true }
}

/**
 * Generate idempotency key
 */
export function generateIdempotencyKey(content: string, channelId: string): string {
  return crypto.createHash("sha256").update(`${content}:${channelId}:${Date.now()}`).digest("hex").slice(0, 32)
}

/**
 * Fire webhooks for message events
 */
export async function fireMessageWebhooks(userId: string, event: string, payload: any): Promise<void> {
  const webhooks = await prisma.webhook.findMany({
    where: {
      userId,
      isActive: true,
      events: {
        array_contains: [event],
      },
    },
  })

  for (const webhook of webhooks) {
    try {
      const signature = crypto.createHmac("sha256", webhook.secret).update(JSON.stringify(payload)).digest("hex")

      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
          "X-Webhook-Event": event,
        },
        body: JSON.stringify(payload),
      })

      await prisma.webhookLog.create({
        data: {
          webhookId: webhook.id,
          event,
          payload,
          response: await response.text(),
          statusCode: response.status,
          success: response.ok,
        },
      })

      await prisma.webhook.update({
        where: { id: webhook.id },
        data: { lastFiredAt: new Date() },
      })
    } catch (error: any) {
      await prisma.webhookLog.create({
        data: {
          webhookId: webhook.id,
          event,
          payload,
          success: false,
          error: error.message,
        },
      })
    }
  }
}

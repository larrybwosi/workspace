import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getAblyRest, AblyChannels, AblyEvents } from "@repo/shared/server"

/**
 * POST /api/webhooks/incoming/[token]
 * Receives messages from external systems (n8n, ERPs, etc.)
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params

    // Find the incoming webhook configuration
    const webhookConfig = await prisma.channelIncomingWebhook.findUnique({
      where: { token },
      include: { channel: true }
    })

    if (!webhookConfig || !webhookConfig.isActive) {
      return NextResponse.json({ error: "Invalid or inactive webhook token" }, { status: 401 })
    }

    const body = await request.json()
    const { content, messageType, metadata, attachments } = body

    if (!content && !attachments) {
      return NextResponse.json({ error: "Message content or attachments required" }, { status: 400 })
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        channelId: webhookConfig.channelId,
        userId: webhookConfig.createdBy, // Attribute to the person who created the webhook
        content: content || "",
        messageType: messageType || "integration",
        metadata: {
          ...metadata,
          isExternal: true,
          webhookName: webhookConfig.name,
          source: "incoming_webhook"
        },
        attachments: attachments ? {
          create: attachments.map((att: any) => ({
            name: att.name,
            type: att.type,
            url: att.url,
            size: att.size?.toString()
          }))
        } : undefined
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    // Update webhook stats
    await prisma.channelIncomingWebhook.update({
      where: { id: webhookConfig.id },
      data: {
        lastReceivedAt: new Date(),
        totalReceived: { increment: 1 }
      }
    })

    // Log the delivery
    await prisma.channelIncomingWebhookLog.create({
      data: {
        webhookId: webhookConfig.id,
        payload: body,
        status: 201
      }
    })

    // Broadcast via Ably
    const ably = getAblyRest(); if (!ably) return NextResponse.json({ error: "Ably not configured" }, { status: 500 });
    const ablyChannel = ably.channels.get(AblyChannels.channel(webhookConfig.channelId))
    await ablyChannel.publish(AblyEvents.MESSAGE_SENT, message)

    return NextResponse.json({ success: true, messageId: message.id }, { status: 201 })
  } catch (error) {
    console.error("Incoming Webhook Error:", error)
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 })
  }
}

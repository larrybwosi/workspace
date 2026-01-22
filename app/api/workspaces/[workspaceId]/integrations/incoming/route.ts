import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import crypto from "crypto"
import { getAblyServer, AblyChannels, AblyEvents } from "@/lib/integrations/ably"

export async function POST(request: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params

    // Verify workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { channels: { where: { type: "announcements" }, take: 1 } },
    })

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    // Get authorization
    const authHeader = request.headers.get("authorization")
    const signature = request.headers.get("x-webhook-signature")
    const integrationId = request.headers.get("x-integration-id")

    let integration = null

    // Verify by integration ID and secret
    if (integrationId) {
      integration = await prisma.workspaceIntegration.findFirst({
        where: { id: integrationId, workspaceId, active: true },
      })

      if (integration && signature) {
        const config = integration.config as Record<string, any>
        const body = await request.text()
        const expectedSignature = crypto
          .createHmac("sha256", config.secret || "")
          .update(body)
          .digest("hex")

        if (signature !== expectedSignature) {
          return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
        }

        // Re-parse body
        const payload = JSON.parse(body)
        return await processIncomingWebhook(workspace, integration, payload)
      }
    }

    // Verify by API key
    if (authHeader?.startsWith("Bearer ")) {
      const apiKey = authHeader.slice(7)
      const hashedKey = crypto.createHash("sha256").update(apiKey).digest("hex")

      const keyRecord = await prisma.apiKey.findFirst({
        where: {
          keyHash: hashedKey,
          active: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      })

      if (keyRecord) {
        const body = await request.json()
        return await processIncomingWebhook(workspace, null, body, keyRecord.userId)
      }
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  } catch (error) {
    console.error("Failed to process incoming webhook:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function processIncomingWebhook(workspace: any, integration: any, payload: any, userId?: string) {
  const { channelId, message, event, data, source, username, avatarUrl, embeds, attachments } = payload

  // Determine target channel
  let targetChannelId = channelId
  if (!targetChannelId && workspace.channels?.[0]) {
    targetChannelId = workspace.channels[0].id
  }

  // Find or create a system user for external messages
  let systemUser = await prisma.user.findFirst({
    where: { email: `system@${workspace.slug}.workspace` },
  })

  if (!systemUser) {
    systemUser = await prisma.user.create({
      data: {
        email: `system@${workspace.slug}.workspace`,
        name: integration?.service ? `${integration.service} Bot` : "External Bot",
        avatar: avatarUrl || "/placeholder.svg?height=40&width=40",
        status: "online",
      },
    })
  }

  // Create message if channel exists
  if (targetChannelId) {
    const channel = await prisma.channel.findUnique({
      where: { id: targetChannelId },
      include: { threads: { take: 1 } },
    })

    if (channel) {
      let thread = channel.threads[0]
      if (!thread) {
        thread = await prisma.thread.create({
          data: { channelId: channel.id, name: "General" },
        })
      }

      const newMessage = await prisma.message.create({
        data: {
          threadId: thread.id,
          userId: systemUser.id,
          content: message || data?.message || JSON.stringify(data),
          metadata: {
            source: source || integration?.service || "external",
            event,
            integration: integration?.id,
            username,
            embeds,
            attachments,
            isExternal: true,
          },
        },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
      })

      // Broadcast via Ably
      try {
        const ably = getAblyServer()
        const ablyChannel = ably.channels.get(AblyChannels.channel(channel.id))
        await ablyChannel.publish(AblyEvents.MESSAGE_CREATED, {
          ...newMessage,
          channelId: channel.id,
        })
      } catch (e) {
        console.error("Ably publish failed:", e)
      }

      return NextResponse.json({
        success: true,
        messageId: newMessage.id,
        channelId: channel.id,
      })
    }
  }

  // If no channel, just log the event
  await prisma.workspaceAuditLog.create({
    data: {
      workspaceId: workspace.id,
      userId: userId || systemUser.id,
      action: "webhook.received",
      resource: "integration",
      resourceId: integration?.id || "external",
      metadata: { event, source, data },
    },
  })

  return NextResponse.json({ success: true, logged: true })
}

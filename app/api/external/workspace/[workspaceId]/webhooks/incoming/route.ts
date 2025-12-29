import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import { getAblyServer, AblyChannels, EVENTS } from "@/lib/ably"

function validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex")
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(`sha256=${expectedSignature}`))
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params
    const rawBody = await request.text()
    const signature = request.headers.get("x-webhook-signature")
    const webhookId = request.headers.get("x-webhook-id")

    if (!webhookId || !signature) {
      return NextResponse.json({ error: "Missing webhook headers" }, { status: 400 })
    }

    const webhook = await prisma.workspaceWebhook.findFirst({
      where: { id: webhookId, workspaceId, direction: "incoming", isActive: true },
    })

    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found or inactive" }, { status: 404 })
    }

    // Validate signature
    if (!validateWebhookSignature(rawBody, signature, webhook.secret)) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 })
    }

    const payload = JSON.parse(rawBody)
    const { action, data } = payload

    let result: any = null

    switch (action) {
      case "send_message":
        if (!data.channelId || !data.content) {
          return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const channel = await prisma.workspaceChannel.findFirst({
          where: { id: data.channelId, workspaceId },
        })

        if (!channel) {
          return NextResponse.json({ error: "Channel not found" }, { status: 404 })
        }

        result = await prisma.message.create({
          data: {
            channelId: data.channelId,
            userId: webhook.createdById,
            content: data.content,
            messageType: "integration",
            metadata: { webhookId: webhook.id, source: "incoming_webhook" },
          },
        })

        const ably = getAblyServer()
        const ablyChannel = ably.channels.get(AblyChannels.channel(data.channelId))
        await ablyChannel.publish(EVENTS.MESSAGE_CREATED, { message: result })
        break

      case "create_channel":
        result = await prisma.workspaceChannel.create({
          data: {
            workspaceId,
            name: data.name,
            description: data.description,
            type: data.type || "public",
            createdById: webhook.createdById,
          },
        })
        break

      case "create_department":
        result = await prisma.workspaceDepartment.create({
          data: {
            workspaceId,
            name: data.name,
            description: data.description,
          },
        })
        break

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }

    await prisma.webhookDelivery.create({
      data: {
        webhookId: webhook.id,
        status: "success",
        request: { action, data },
        response: result,
        responseStatus: 200,
      },
    })

    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId,
        userId: webhook.createdById,
        action: `webhook.${action}`,
        resource: "webhook",
        resourceId: webhook.id,
        metadata: { action, webhookName: webhook.name },
      },
    })

    return NextResponse.json({ success: true, result }, { status: 200 })
  } catch (error) {
    console.error("[v0] Incoming webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

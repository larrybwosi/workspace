import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import { z } from "zod"
import { getAblyServer } from "@/lib/ably"

const incomingMessageSchema = z.object({
  content: z.string().min(1),
  username: z.string().optional(),
  userId: z.string().optional(),
  attachments: z
    .array(
      z.object({
        url: z.string().url(),
        filename: z.string(),
        type: z.string(),
      }),
    )
    .optional(),
})

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex")

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
}

export async function POST(request: NextRequest, { params }: { params: { channelId: string } }) {
  try {
    const webhookToken = request.headers.get("x-webhook-token")
    const signature = request.headers.get("x-webhook-signature")

    if (!webhookToken) {
      return NextResponse.json({ error: "Missing webhook token" }, { status: 401 })
    }

    // Find the incoming webhook config for this channel
    const webhook = await prisma.channelIncomingWebhook.findFirst({
      where: {
        channelId: params.channelId,
        token: webhookToken,
        isActive: true,
      },
      include: {
        channel: {
          include: {
            workspace: true,
          },
        },
      },
    })

    if (!webhook) {
      return NextResponse.json({ error: "Invalid webhook token" }, { status: 401 })
    }

    // Verify signature if provided
    const rawBody = await request.text()
    if (signature && !verifyWebhookSignature(rawBody, signature, webhook.secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const body = JSON.parse(rawBody)
    const validatedData = incomingMessageSchema.parse(body)

    // Create system user message
    const message = await prisma.message.create({
      data: {
        threadId: params.channelId,
        content: validatedData.content,
        userId: validatedData.userId || undefined,
        metadata: {
          webhookName: webhook.name,
          username: validatedData.username || "Webhook",
          attachments: validatedData.attachments || [],
          webhookId: webhook.id,
        },
      },
    })

    // Send real-time notification
    const ably = getAblyServer()
    const channel = ably.channels.get(`channel:${params.channelId}`)
    await channel.publish("message", {
      action: "created",
      message,
    })

    // Log the webhook delivery
    await prisma.channelIncomingWebhookLog.create({
      data: {
        webhookId: webhook.id,
        payload: body,
        status: 200,
        response: "Message created successfully",
      },
    })

    await prisma.channelIncomingWebhook.update({
      where: { id: webhook.id },
      data: {
        lastReceivedAt: new Date(),
        totalReceived: { increment: 1 },
      },
    })

    return NextResponse.json({ success: true, messageId: message.id }, { status: 201 })
  } catch (error) {
    console.error("Incoming webhook error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

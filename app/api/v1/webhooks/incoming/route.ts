import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateWebhookSignature } from "@/lib/api-auth"
import { z } from "zod"
import { sendRealtimeMessage } from "@/lib/ably"

const webhookPayloadSchema = z.object({
  action: z.enum(["send_message", "create_channel", "create_department", "add_member"]),
  data: z.record(z.any()),
})

/**
 * POST /api/v1/webhooks/incoming
 * Handle incoming webhook requests (workspace ID derived from webhook ID)
 */
export async function POST(request: NextRequest) {
  try {
    const webhookId = request.headers.get("x-webhook-id")
    const signature = request.headers.get("x-webhook-signature")

    if (!webhookId || !signature) {
      return NextResponse.json({ error: "Missing webhook headers", code: "MISSING_HEADERS" }, { status: 400 })
    }

    // Find webhook configuration
    const webhook = await prisma.workspaceWebhook.findUnique({
      where: { id: webhookId },
      include: { workspace: true },
    })

    if (!webhook || !webhook.isActive) {
      return NextResponse.json({ error: "Webhook not found or inactive", code: "INVALID_WEBHOOK" }, { status: 404 })
    }

    // Validate signature
    const rawBody = await request.text()
    const isValid = validateWebhookSignature(rawBody, signature.replace("sha256=", ""), webhook.secret)

    if (!isValid) {
      await prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          status: "failed",
          request: { headers: Object.fromEntries(request.headers), body: rawBody },
          response: { error: "Invalid signature" },
        },
      })

      return NextResponse.json({ error: "Invalid signature", code: "INVALID_SIGNATURE" }, { status: 401 })
    }

    // Parse and validate payload
    const payload = webhookPayloadSchema.parse(JSON.parse(rawBody))

    let result: any = {}

    // Handle different actions
    switch (payload.action) {
      case "send_message":
        const messageData = z
          .object({
            channelId: z.string(),
            content: z.string(),
          })
          .parse(payload.data)

        const message = await prisma.message.create({
          data: {
            channelId: messageData.channelId,
            userId: webhook.createdById,
            content: messageData.content,
            messageType: "integration",
          },
        })

        await sendRealtimeMessage(`channel:${messageData.channelId}`, "message.created", { message })
        result = { messageId: message.id }
        break

      case "create_channel":
        const channelData = z
          .object({
            name: z.string(),
            description: z.string().optional(),
            type: z.enum(["public", "private"]).optional(),
          })
          .parse(payload.data)

        const channel = await prisma.channel.create({
          data: {
            workspaceId: webhook.workspaceId,
            name: channelData.name,
            description: channelData.description,
            type: channelData.type || "public",
            createdById: webhook.createdById,
          },
        })

        await sendRealtimeMessage(`workspace:${webhook.workspaceId}`, "channel.created", { channel })
        result = { channelId: channel.id }
        break

      case "create_department":
        const deptData = z
          .object({
            name: z.string(),
            description: z.string().optional(),
          })
          .parse(payload.data)

        const department = await prisma.department.create({
          data: {
            workspaceId: webhook.workspaceId,
            name: deptData.name,
            description: deptData.description,
          },
        })

        result = { departmentId: department.id }
        break

      case "add_member":
        const memberData = z
          .object({
            email: z.string().email(),
            role: z.enum(["owner", "admin", "member", "guest"]).optional(),
          })
          .parse(payload.data)

        let user = await prisma.user.findUnique({
          where: { email: memberData.email },
        })

        if (!user) {
          user = await prisma.user.create({
            data: {
              email: memberData.email,
              name: memberData.email.split("@")[0],
            },
          })
        }

        const member = await prisma.workspaceMember.create({
          data: {
            workspaceId: webhook.workspaceId,
            userId: user.id,
            role: memberData.role || "member",
          },
        })

        result = { memberId: member.id }
        break
    }

    // Log successful delivery
    await prisma.webhookDelivery.create({
      data: {
        webhookId: webhook.id,
        status: "success",
        request: { headers: Object.fromEntries(request.headers), body: JSON.parse(rawBody) },
        response: { success: true, result },
        responseTime: 0, // Could track actual time
      },
    })

    // Update webhook stats
    await prisma.workspaceWebhook.update({
      where: { id: webhook.id },
      data: {
        lastTriggeredAt: new Date(),
        deliveryCount: { increment: 1 },
        successCount: { increment: 1 },
      },
    })

    return NextResponse.json({
      success: true,
      action: payload.action,
      result,
    })
  } catch (error) {
    console.error("[v0] Webhook processing failed:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid payload", code: "INVALID_PAYLOAD", details: error.errors },
        { status: 400 },
      )
    }

    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 })
  }
}

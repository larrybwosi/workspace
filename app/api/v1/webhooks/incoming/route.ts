import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { validateWebhookSignature } from "@/lib/auth/api-auth"
import { z } from "zod"
import { sendRealtimeMessage } from "@/lib/integrations/ably"

// Simple slugify helper
const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")

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
      return NextResponse.json(
        { error: "Missing webhook headers", code: "MISSING_HEADERS" },
        { status: 400 }
      )
    }

    // Find webhook configuration
    // We include workspace to access ownerId, as WorkspaceWebhook doesn't have createdById
    const webhook = await prisma.workspaceWebhook.findUnique({
      where: { id: webhookId },
      include: { workspace: true },
    })

    if (!webhook || !webhook.active) {
      return NextResponse.json(
        { error: "Webhook not found or inactive", code: "INVALID_WEBHOOK" },
        { status: 404 }
      )
    }

    // Validate signature
    const rawBody = await request.text()
    const isValid = validateWebhookSignature(
      rawBody,
      signature.replace("sha256=", ""),
      webhook.secret
    )

    if (!isValid) {
      // Updated to match schema: WorkspaceWebhookLog
      await prisma.workspaceWebhookLog.create({
        data: {
          webhookId: webhook.id,
          event: "unknown", // Event is unknown if signature fails
          success: false,
          payload: { headers: Object.fromEntries(request.headers), body: rawBody },
          response: { error: "Invalid signature" },
        },
      })

      return NextResponse.json(
        { error: "Invalid signature", code: "INVALID_SIGNATURE" },
        { status: 401 }
      )
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
            // Fallback to workspace owner since Webhook doesn't track a specific creator
            userId: webhook.workspace.ownerId, 
            content: messageData.content,
            messageType: "integration",
          },
        })

        await sendRealtimeMessage(
          `channel:${messageData.channelId}`,
          "message.created",
          { message }
        )
        result = { messageId: message.id }
        break

      case "create_channel":
        const channelData = z
          .object({
            name: z.string(),
            description: z.string().optional(),
            type: z.string().optional(), // Schema uses string for type
            icon: z.string().optional(),
          })
          .parse(payload.data)

        const channel = await prisma.channel.create({
          data: {
            workspaceId: webhook.workspaceId,
            name: channelData.name,
            description: channelData.description,
            type: channelData.type || "channel",
            // Icon is required in schema
            icon: channelData.icon || "hash", 
            // createdById is optional in Channel, we can omit or use owner
            createdById: webhook.workspace.ownerId, 
          },
        })

        await sendRealtimeMessage(
          `workspace:${webhook.workspaceId}`,
          "channel.created",
          { channel }
        )
        result = { channelId: channel.id }
        break

      case "create_department":
        const deptData = z
          .object({
            name: z.string(),
            description: z.string().optional(),
          })
          .parse(payload.data)

        // Updated to use WorkspaceDepartment
        const department = await prisma.workspaceDepartment.create({
          data: {
            workspaceId: webhook.workspaceId,
            name: deptData.name,
            // Slug is required in schema
            slug: slugify(deptData.name),
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
    // Updated to match schema: WorkspaceWebhookLog
    await prisma.workspaceWebhookLog.create({
      data: {
        webhookId: webhook.id,
        event: payload.action,
        success: true,
        payload: JSON.parse(rawBody),
        response: { success: true, result },
      },
    })

    // Note: The schema for WorkspaceWebhook does not include 
    // lastTriggeredAt, deliveryCount, or successCount, so those updates were removed.

    return NextResponse.json({
      success: true,
      action: payload.action,
      result,
    })
  } catch (error) {
    console.error("Webhook processing failed:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid payload", code: "INVALID_PAYLOAD", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    )
  }
}
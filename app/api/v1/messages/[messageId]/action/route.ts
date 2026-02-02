import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { sendRealtimeMessage } from "@/lib/integrations/ably"

const actionResponseSchema = z.object({
  actionId: z.string().min(1),
  comment: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

/**
 * POST /api/v1/messages/:messageId/actions
 * Submit a response to an interactive message action
 */
export async function POST(request: NextRequest, { params }: { params: { messageId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { messageId } = params
    const body = await request.json()
    const data = actionResponseSchema.parse(body)

    // Fetch message with actions
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        actions: true,
        channel: {
          include: {
            workspace: true,
          },
        },
      },
    })

    if (!message) {
      return NextResponse.json({ error: "Message not found", code: "MESSAGE_NOT_FOUND" }, { status: 404 })
    }

    // Verify action exists
    const action = message.actions.find((a) => a.actionId === data.actionId)

    if (!action) {
      return NextResponse.json({ error: "Action not found", code: "ACTION_NOT_FOUND" }, { status: 404 })
    }

    // Check if user already responded to this action
    const existingResponse = await prisma.messageActionResponse.findUnique({
      where: {
        actionId_userId: {
          actionId: action.id,
          userId: session.user.id,
        },
      },
    })

    if (existingResponse) {
      return NextResponse.json({ error: "Action already responded", code: "ALREADY_RESPONDED" }, { status: 400 })
    }

    // Get callback URL from message metadata
    const callbackUrl = (message.metadata as any)?.callbackUrl

    // Create action response
    const response = await prisma.messageActionResponse.create({
      data: {
        actionId: action.id,
        messageId: message.id,
        userId: session.user.id,
        actionValue: data.actionId,
        comment: data.comment,
        metadata: data.metadata,
        webhookUrl: callbackUrl,
        webhookSent: false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        action: true,
      },
    })

    // Send real-time update
    await sendRealtimeMessage(`channel:${message.channel.id}`, "message.action_response", {
      messageId: message.id,
      actionId: data.actionId,
      response,
    })

    // Send webhook callback if URL is provided
    if (callbackUrl) {
      try {
        await fetch(callbackUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Event": "message.action_response",
          },
          body: JSON.stringify({
            event: "message.action_response",
            timestamp: new Date().toISOString(),
            workspace: {
              id: message.channel?.workspace?.id,
              name: message.channel.workspace?.name,
            },
            message: {
              id: message.id,
              content: message.content,
              channelId: message.channel.id,
            },
            action: {
              id: data.actionId,
              label: action.label,
            },
            response: {
              userId: session.user.id,
              userName: session.user.name,
              userEmail: session.user.email,
              actionValue: data.actionId,
              comment: data.comment,
              metadata: data.metadata,
              respondedAt: response.respondedAt.toISOString(),
            },
          }),
        })

        // Mark webhook as sent
        await prisma.messageActionResponse.update({
          where: { id: response.id },
          data: { webhookSent: true },
        })
      } catch (webhookError) {
        console.error("Failed to send webhook callback:", webhookError)
        // Don't fail the request if webhook fails
      }
    }

    // Log to audit trail
    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId: message.channel.workspace?.id || "",
        userId: session.user.id,
        action: "message.action_responded",
        resource: "message_action",
        resourceId: response.id,
        metadata: {
          messageId: message.id,
          actionId: data.actionId,
          channelId: message.channel.id,
        },
      },
    })

    return NextResponse.json({
      success: true,
      response,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", code: "INVALID_REQUEST_BODY", details: error.errors },
        { status: 400 },
      )
    }
    console.error("Failed to process action response:", error)
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 })
  }
}

/**
 * GET /api/v1/messages/:messageId/actions
 * Get all responses for a message's actions
 */
export async function GET(request: NextRequest, { params }: { params: { messageId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { messageId } = params

    // Fetch all action responses for this message
    const responses = await prisma.messageActionResponse.findMany({
      where: { messageId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        action: true,
      },
      orderBy: { respondedAt: "desc" },
    })

    return NextResponse.json({
      success: true,
      responses,
    })
  } catch (error) {
    console.error("Failed to fetch action responses:", error)
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 })
  }
}

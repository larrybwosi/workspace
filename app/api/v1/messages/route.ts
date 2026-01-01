import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateWorkspaceApiKey, hasPermission, isRateLimitExceeded } from "@/lib/api-auth"
import { z } from "zod"
import { AblyChannels, AblyEvents, getAblyRest, sendRealtimeMessage } from "@/lib/ably"

const sendMessageSchema = z.object({
  channelId: z.string().min(1),
  content: z.string().min(1).max(10000),
  messageType: z
    .enum(["text", "system", "custom", "standard", "code", "comment-request", "approval-request","report"])
    .optional()
    .default("custom"),
  metadata: z.record(z.any()).optional(),
  // Add this section to validate incoming actions
  actions: z
    .array(
      z.object({
        actionId: z.string().min(1), // Required: Unique ID for the button logic (e.g. "approve_request")
        label: z.string().min(1), // Required: Text to display on the button
        style: z.enum(["default", "primary", "danger"]).optional(),
        value: z.string().optional(),
        disabled: z.boolean().optional(),
        order: z.number().optional(),
      })
    )
    .optional(),
  attachments: z
    .array(
      z.object({
        name: z.string(),
        type: z.string(),
        url: z.string().url(),
        size: z.number(),
      })
    )
    .optional(),
});

/**
 * POST /api/v1/messages
 * Send a message to a channel (workspace ID derived from API token)
 */
export async function POST(request: NextRequest) {
  try {
    const context = await authenticateWorkspaceApiKey(request)
    // console.log("Authenticated context:", context)

    if (!context) {
      return NextResponse.json(
        { error: "Unauthorized", code: "INVALID_API_KEY", message: "Invalid or missing API token" },
        {
          status: 401,
          headers: { "WWW-Authenticate": 'Bearer realm="API"' },
        },
      )
    }

    // Check rate limit
    if (isRateLimitExceeded(context)) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          code: "RATE_LIMIT_EXCEEDED",
          message: `Rate limit of ${context.rateLimit} requests per hour exceeded`,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": context.rateLimit.toString(),
            "X-RateLimit-Remaining": "0",
            "Retry-After": "3600",
          },
        },
      )
    }

    // Check permission
    if (!hasPermission(context, "send:messages")) {
      return NextResponse.json(
        { error: "Forbidden", code: "INSUFFICIENT_PERMISSIONS", message: "Token lacks 'send:messages' permission" },
        { status: 403 },
      )
    }

    const body = await request.json()
    const data = sendMessageSchema.parse(body)

    console.log("Parsed message data:", data)

    // Verify channel exists and belongs to workspace
    const channel = await prisma.channel.findFirst({
      where: {
        id: data.channelId,
        workspaceId: context.workspaceId,
      },
    })

    if (!channel) {
      return NextResponse.json(
        { error: "Channel not found", code: "CHANNEL_NOT_FOUND", message: "Channel does not exist in this workspace" },
        { status: 404 },
      )
    }

// Create message
    const message = await prisma.message.create({
      data: {
        channelId: data.channelId,
        userId: context.userId,
        content: data.content,
        messageType: data.messageType,
        metadata: data.metadata || {},
        // Add this block to create actions in the DB [cite: 247]
        actions: {
          create: data.actions?.map((action, index) => ({
            actionId: action.actionId,
            label: action.label,
            style: action.style || "default",
            value: action.value,
            disabled: action.disabled || false,
            order: action.order ?? index, // Default to array index if no order provided
          })) || [],
        },
        attachments: {
          create: data.attachments?.map((attachment) => ({
            name: attachment.name,
            type: attachment.type,
            url: attachment.url,
            size: attachment.size.toString(),
          })) || [],
        },
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
        actions: true, // Make sure to include actions in the response
      },
    })

    // Send real-time notification
    // await sendRealtimeMessage(`${data.channelId}`, AblyEvents.MESSAGE_SENT, {
    //   message,
    //   channelId: data.channelId,
    // });
    const ably = getAblyRest();
    const ablyChannel = ably.channels.get(AblyChannels.channel(data.channelId));
    await ablyChannel.publish(AblyEvents.MESSAGE_SENT, message);

    // Log to audit trail
    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId: context.workspaceId,
        userId: context.userId,
        action: "message.sent_via_api",
        resource: "message",
        resourceId: message.id,
        metadata: { channelId: data.channelId, messageType: data.messageType },
      },
    })
    return NextResponse.json(
      {
        success: true,
        message,
      },
      {
        status: 201,
        headers: {
          "X-RateLimit-Limit": context.rateLimit.toString(),
          "X-RateLimit-Remaining": (context.rateLimit - context.usageCount).toString(),
        },
      },
    )
  } catch (error) {
    console.log("Error in POST /api/v1/messages:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", code: "INVALID_REQUEST_BODY", details: error.errors },
        { status: 400 },
      )
    }
    console.error("Failed to send message via API:", error)
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 })
  }
}

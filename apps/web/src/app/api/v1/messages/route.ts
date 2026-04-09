import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { authenticateV1, hasPermission, isRateLimitExceeded } from "@/lib/auth/api-auth"
import { z } from "zod"
import { AblyChannels, AblyEvents, getAblyRest } from "@repo/shared"

const sendMessageSchema = z.object({
  channelId: z.string().min(1),
  content: z.string().min(1).max(10000),
  messageType: z
    .enum(["text", "system", "custom", "standard", "code", "comment-request", "approval-request","report"])
    .optional()
    .default("custom"),
  metadata: z.record(z.string(), z.any()).optional(),
  actions: z
    .array(
      z.object({
        actionId: z.string().min(1),
        label: z.string().min(1),
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

export async function POST(request: NextRequest) {
  try {
    const context = await authenticateV1(request as any)

    if (!context) {
      return NextResponse.json(
        { error: "Unauthorized", code: "INVALID_TOKEN", message: "Invalid or missing token" },
        {
          status: 401,
          headers: { "WWW-Authenticate": 'Bearer realm="API"' },
        },
      )
    }

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

    if (!hasPermission(context, "messages:write")) {
      return NextResponse.json(
        { error: "Forbidden", code: "INSUFFICIENT_PERMISSIONS", message: "Token lacks 'messages:write' permission" },
        { status: 403 },
      )
    }

    const body = await request.json()
    const data = sendMessageSchema.parse(body)

    const channel = await prisma.channel.findFirst({
      where: {
        id: data.channelId,
        ...(context.workspaceId ? { workspaceId: context.workspaceId } : {}),
      },
    })

    if (!channel) {
      return NextResponse.json(
        { error: "Channel not found", code: "CHANNEL_NOT_FOUND", message: "Channel does not exist or is not accessible" },
        { status: 404 },
      )
    }

    const message = await prisma.message.create({
      data: {
        channelId: data.channelId,
        userId: context.userId,
        content: data.content,
        messageType: data.messageType,
        metadata: data.metadata || {},
        actions: {
          create: data.actions?.map((action, index) => ({
            actionId: action.actionId,
            label: action.label,
            style: action.style || "default",
            value: action.value,
            disabled: action.disabled || false,
            order: action.order ?? index,
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
        actions: true,
      },
    })

    const ably = getAblyRest(); if (!ably) return NextResponse.json({ error: "Ably not configured" }, { status: 500 });;
    if (ably) {
      const ablyChannel = ably.channels.get(AblyChannels.channel(data.channelId));
      await ablyChannel.publish(AblyEvents.MESSAGE_SENT, message);
    }

    if (context.workspaceId) {
      await prisma.workspaceAuditLog.create({
        data: {
          workspaceId: context.workspaceId,
          userId: context.userId,
          action: "message.sent_via_api",
          resource: "message",
          resourceId: message.id,
          metadata: { channelId: data.channelId, authType: context.authType },
        },
      })
    }

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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", code: "INVALID_REQUEST_BODY", details: error.issues },
        { status: 400 },
      )
    }
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 })
  }
}

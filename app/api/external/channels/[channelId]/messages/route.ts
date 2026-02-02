import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { authenticateApiKey, hasPermission } from "@/lib/auth/api-auth"
import { checkRateLimit, getRateLimitHeaders } from "@/lib/utils/rate-limiter"
import {
  createExternalMessage,
  validateChannelAccess,
  fireMessageWebhooks,
  type ExternalMessage,
} from "@/lib/utils/external-message-utils"
import { prisma } from "@/lib/db/prisma"

const messageSchema = z.object({
  content: z.string().min(1).max(4000),
  messageType: z.enum(["standard", "system", "bot", "integration", "alert", "announcement"]).optional(),
  metadata: z.record(z.any()).optional(),
  attachments: z
    .array(
      z.object({
        name: z.string(),
        type: z.string(),
        url: z.string().url(),
        size: z.number().optional(),
      }),
    )
    .optional(),
  embeds: z
    .array(
      z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        url: z.string().url().optional(),
        color: z.string().optional(),
        thumbnail: z.string().url().optional(),
        fields: z
          .array(
            z.object({
              name: z.string(),
              value: z.string(),
              inline: z.boolean().optional(),
            }),
          )
          .optional(),
        footer: z.string().optional(),
        timestamp: z.string().datetime().optional(),
      }),
    )
    .optional(),
  source: z
    .object({
      name: z.string(),
      icon: z.string().url().optional(),
      url: z.string().url().optional(),
    })
    .optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  silent: z.boolean().optional(),
})

/**
 * GET /api/external/channels/[channelId]/messages
 * Retrieve messages from a channel
 */
export async function GET(request: NextRequest, { params }: { params: { channelId: string } }) {
  try {
    const apiContext = await authenticateApiKey(request)
    if (!apiContext) {
      return NextResponse.json({ error: "Unauthorized", code: "INVALID_API_KEY" }, { status: 401 })
    }

    if (!hasPermission(apiContext, "messages:read")) {
      return NextResponse.json({ error: "Forbidden", code: "INSUFFICIENT_PERMISSIONS" }, { status: 403 })
    }

    const { channelId } = params
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "50"), 100)
    const cursor = searchParams.get("cursor")
    const before = searchParams.get("before")
    const after = searchParams.get("after")

    const channelAccess = await validateChannelAccess(channelId, apiContext.userId)
    if (!channelAccess.valid) {
      return NextResponse.json({ error: "Not Found", message: channelAccess.error }, { status: 404 })
    }

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    })

    const thread = await prisma.thread.findFirst({
      where: {
        channelId,
        title: `${channel?.name} General`,
      },
    })

    if (!thread) {
      return NextResponse.json({
        messages: [],
        pagination: { hasMore: false, nextCursor: null },
      })
    }

    const whereClause: any = { threadId: thread.id }

    if (cursor) {
      whereClause.timestamp = { lt: new Date(cursor) }
    }
    if (before) {
      whereClause.timestamp = { ...whereClause.timestamp, lt: new Date(before) }
    }
    if (after) {
      whereClause.timestamp = { ...whereClause.timestamp, gt: new Date(after) }
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        attachments: true,
        reactions: true,
      },
      orderBy: { timestamp: "desc" },
      take: limit + 1,
    })

    const hasMore = messages.length > limit
    const data = hasMore ? messages.slice(0, limit) : messages
    const nextCursor = hasMore ? data[data.length - 1].timestamp.toISOString() : null

    return NextResponse.json({
      messages: data.reverse().map((m) => ({
        id: m.id,
        content: m.content,
        messageType: m.messageType,
        timestamp: m.timestamp.toISOString(),
        user: m.user,
        attachments: m.attachments,
        reactions: m.reactions,
        metadata: m.metadata,
      })),
      pagination: {
        hasMore,
        nextCursor,
        limit,
      },
    })
  } catch (error) {
    console.error("[External API] Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

/**
 * POST /api/external/channels/[channelId]/messages
 * Send a message to a specific channel
 */
export async function POST(request: NextRequest, { params }: { params: { channelId: string } }) {
  try {
    const apiContext = await authenticateApiKey(request)
    if (!apiContext) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          code: "INVALID_API_KEY",
          message: "Provide your API key in the X-API-Key header",
        },
        { status: 401 },
      )
    }

    if (!hasPermission(apiContext, "messages:write")) {
      return NextResponse.json(
        {
          error: "Forbidden",
          code: "INSUFFICIENT_PERMISSIONS",
          message: "API key requires 'messages:write' permission",
        },
        { status: 403 },
      )
    }

    const apiKey = await prisma.apiKey.findUnique({
      where: { key: apiContext.apiKey },
    })

    const rateLimit = await checkRateLimit(apiKey?.id || apiContext.apiKey, apiKey?.rateLimit || 1000)

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "Too Many Requests",
          code: "RATE_LIMIT_EXCEEDED",
          retryAfter: rateLimit.retryAfter,
        },
        { status: 429, headers: getRateLimitHeaders(rateLimit) },
      )
    }

    const { channelId } = params
    const body = await request.json()
    const validatedData = messageSchema.parse(body)

    const channelAccess = await validateChannelAccess(channelId, apiContext.userId)
    if (!channelAccess.valid) {
      return NextResponse.json({ error: "Not Found", message: channelAccess.error }, { status: 404 })
    }

    const result = await createExternalMessage(
      channelId,
      apiContext.userId,
      validatedData as ExternalMessage,
      apiKey?.id || "",
    )

    await fireMessageWebhooks(apiContext.userId, "message.created", {
      message: result,
      channelId,
      source: "external_api",
    })

    return NextResponse.json({ success: true, data: result }, { status: 201, headers: getRateLimitHeaders(rateLimit) })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation Error",
          code: "INVALID_REQUEST_BODY",
          details: error.errors,
        },
        { status: 400 },
      )
    }
    console.error("[External API] Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

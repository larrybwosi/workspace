import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { authenticateApiKey, hasPermission } from "@/lib/api-auth"
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limiter"
import {
  createExternalMessage,
  validateChannelAccess,
  fireMessageWebhooks,
  type ExternalMessage,
} from "@/lib/external-message-utils"
import { prisma } from "@/lib/prisma"

const messageSchema = z.object({
  channelId: z.string().min(1, "Channel ID is required"),
  content: z.string().min(1, "Content is required").max(4000, "Content too long"),
  messageType: z
    .enum(["standard", "system", "bot", "integration", "alert", "announcement"])
    .optional()
    .default("integration"),
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
  expiresAt: z.string().datetime().optional(),
  silent: z.boolean().optional(),
})

const batchMessageSchema = z.object({
  messages: z.array(messageSchema).min(1).max(100),
})

/**
 * POST /api/external/messages
 * Send a message to a channel from an external application
 *
 * Authentication: X-API-Key header required
 * Required permission: messages:write
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate API key
    const apiContext = await authenticateApiKey(request)
    if (!apiContext) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          code: "INVALID_API_KEY",
          message: "Missing or invalid API key. Provide your API key in the X-API-Key header.",
        },
        { status: 401 },
      )
    }

    // Check permissions
    if (!hasPermission(apiContext, "messages:write")) {
      return NextResponse.json(
        {
          error: "Forbidden",
          code: "INSUFFICIENT_PERMISSIONS",
          message: "API key does not have 'messages:write' permission.",
        },
        { status: 403 },
      )
    }

    // Check rate limit
    const apiKey = await prisma.apiKey.findUnique({
      where: { key: apiContext.apiKey },
    })

    const rateLimit = await checkRateLimit(apiKey?.id || apiContext.apiKey, apiKey?.rateLimit || 1000)

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "Too Many Requests",
          code: "RATE_LIMIT_EXCEEDED",
          message: `Rate limit exceeded. Retry after ${rateLimit.retryAfter} seconds.`,
          retryAfter: rateLimit.retryAfter,
        },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimit),
        },
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = messageSchema.parse(body)

    // Validate channel access
    const channelAccess = await validateChannelAccess(validatedData.channelId, apiContext.userId)

    if (!channelAccess.valid) {
      return NextResponse.json(
        {
          error: "Not Found",
          code: "CHANNEL_NOT_FOUND",
          message: channelAccess.error,
        },
        { status: 404 },
      )
    }

    // Create the message
    const result = await createExternalMessage(
      validatedData.channelId,
      apiContext.userId,
      validatedData as ExternalMessage,
      apiKey?.id || "",
    )

    // Fire webhooks
    await fireMessageWebhooks(apiContext.userId, "message.created", {
      message: result,
      source: "external_api",
    })

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      {
        status: 201,
        headers: getRateLimitHeaders(rateLimit),
      },
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation Error",
          code: "INVALID_REQUEST_BODY",
          message: "Request body validation failed",
          details: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 },
      )
    }

    console.error("[External API] Error:", error)
    return NextResponse.json(
      {
        error: "Internal Server Error",
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
      { status: 500 },
    )
  }
}

/**
 * POST /api/external/messages/batch
 * Send multiple messages in a single request (up to 100)
 */
export async function PUT(request: NextRequest) {
  try {
    const apiContext = await authenticateApiKey(request)
    if (!apiContext) {
      return NextResponse.json({ error: "Unauthorized", code: "INVALID_API_KEY" }, { status: 401 })
    }

    if (!hasPermission(apiContext, "messages:write")) {
      return NextResponse.json({ error: "Forbidden", code: "INSUFFICIENT_PERMISSIONS" }, { status: 403 })
    }

    const apiKey = await prisma.apiKey.findUnique({
      where: { key: apiContext.apiKey },
    })

    const rateLimit = await checkRateLimit(apiKey?.id || apiContext.apiKey, apiKey?.rateLimit || 1000)

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded", retryAfter: rateLimit.retryAfter },
        { status: 429, headers: getRateLimitHeaders(rateLimit) },
      )
    }

    const body = await request.json()
    const validatedData = batchMessageSchema.parse(body)

    const results = []
    const errors = []

    for (let i = 0; i < validatedData.messages.length; i++) {
      const message = validatedData.messages[i]
      try {
        const channelAccess = await validateChannelAccess(message.channelId, apiContext.userId)

        if (!channelAccess.valid) {
          errors.push({ index: i, error: channelAccess.error })
          continue
        }

        const result = await createExternalMessage(
          message.channelId,
          apiContext.userId,
          message as ExternalMessage,
          apiKey?.id || "",
        )
        results.push({ index: i, data: result })
      } catch (err: any) {
        errors.push({ index: i, error: err.message })
      }
    }

    return NextResponse.json(
      {
        success: true,
        results,
        errors,
        summary: {
          total: validatedData.messages.length,
          succeeded: results.length,
          failed: errors.length,
        },
      },
      { headers: getRateLimitHeaders(rateLimit) },
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateWorkspaceApiKey, hasPermission, isRateLimitExceeded } from "@/lib/api-auth"
import { z } from "zod"
import { sendRealtimeMessage } from "@/lib/ably"

const createChannelSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(["public", "private"]).default("public"),
  departmentId: z.string().optional(),
})

/**
 * GET /api/v1/channels
 * List all channels in workspace (workspace ID derived from API token)
 */
export async function GET(request: NextRequest) {
  try {
    const context = await authenticateWorkspaceApiKey(request)

    if (!context) {
      return NextResponse.json({ error: "Unauthorized", code: "INVALID_API_KEY" }, { status: 401 })
    }

    if (isRateLimitExceeded(context)) {
      return NextResponse.json({ error: "Rate limit exceeded", code: "RATE_LIMIT_EXCEEDED" }, { status: 429 })
    }

    if (!hasPermission(context, "read:channels")) {
      return NextResponse.json({ error: "Forbidden", code: "INSUFFICIENT_PERMISSIONS" }, { status: 403 })
    }

    const channels = await prisma.channel.findMany({
      where: { workspaceId: context.workspaceId },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            messages: true,
            members: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(
      { channels },
      {
        headers: {
          "X-RateLimit-Limit": context.rateLimit.toString(),
          "X-RateLimit-Remaining": (context.rateLimit - context.usageCount).toString(),
        },
      },
    )
  } catch (error) {
    console.error("[v0] Failed to list channels via API:", error)
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 })
  }
}

/**
 * POST /api/v1/channels
 * Create a new channel (workspace ID derived from API token)
 */
export async function POST(request: NextRequest) {
  try {
    const context = await authenticateWorkspaceApiKey(request)

    if (!context) {
      return NextResponse.json({ error: "Unauthorized", code: "INVALID_API_KEY" }, { status: 401 })
    }

    if (isRateLimitExceeded(context)) {
      return NextResponse.json({ error: "Rate limit exceeded", code: "RATE_LIMIT_EXCEEDED" }, { status: 429 })
    }

    if (!hasPermission(context, "write:channels")) {
      return NextResponse.json({ error: "Forbidden", code: "INSUFFICIENT_PERMISSIONS" }, { status: 403 })
    }

    const body = await request.json()
    const data = createChannelSchema.parse(body)

    // Verify department exists if provided
    if (data.departmentId) {
      const department = await prisma.department.findFirst({
        where: {
          id: data.departmentId,
          workspaceId: context.workspaceId,
        },
      })

      if (!department) {
        return NextResponse.json({ error: "Department not found", code: "DEPARTMENT_NOT_FOUND" }, { status: 404 })
      }
    }

    // Create channel
    const channel = await prisma.channel.create({
      data: {
        workspaceId: context.workspaceId,
        name: data.name,
        description: data.description,
        type: data.type,
        departmentId: data.departmentId,
        createdById: context.userId,
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Send real-time notification
    await sendRealtimeMessage(`workspace:${context.workspaceId}`, "channel.created", {
      channel,
    })

    // Log to audit trail
    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId: context.workspaceId,
        userId: context.userId,
        action: "channel.created_via_api",
        resource: "channel",
        resourceId: channel.id,
        metadata: { name: data.name, type: data.type },
      },
    })

    return NextResponse.json(
      {
        success: true,
        channel,
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
        { error: "Invalid request body", code: "INVALID_REQUEST_BODY", details: error.errors },
        { status: 400 },
      )
    }
    console.error("[v0] Failed to create channel via API:", error)
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 })
  }
}

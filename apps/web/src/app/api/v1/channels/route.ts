import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { authenticateV1, hasPermission, isRateLimitExceeded } from "@/lib/auth/api-auth"
import { z } from "zod"
import { getAblyRest, AblyChannels } from "@/lib/integrations/ably"

const createChannelSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(["public", "private"]).default("public"),
  workspaceId: z.string().optional(),
  departmentId: z.string().optional(),
  icon: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const context = await authenticateV1(request as any)

    if (!context) {
      return NextResponse.json({ error: "Unauthorized", code: "INVALID_TOKEN" }, { status: 401 })
    }

    if (isRateLimitExceeded(context)) {
      return NextResponse.json({ error: "Rate limit exceeded", code: "RATE_LIMIT_EXCEEDED" }, { status: 429 })
    }

    if (!hasPermission(context, "channels:read")) {
      return NextResponse.json({ error: "Forbidden", code: "INSUFFICIENT_PERMISSIONS" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get("workspaceId") || context.workspaceId

    const channels = await prisma.channel.findMany({
      where: {
        ...(workspaceId ? { workspaceId } : {}),
      },
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
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await authenticateV1(request as any)

    if (!context) {
      return NextResponse.json({ error: "Unauthorized", code: "INVALID_TOKEN" }, { status: 401 })
    }

    if (isRateLimitExceeded(context)) {
      return NextResponse.json({ error: "Rate limit exceeded", code: "RATE_LIMIT_EXCEEDED" }, { status: 429 })
    }

    if (!hasPermission(context, "channels:write")) {
      return NextResponse.json({ error: "Forbidden", code: "INSUFFICIENT_PERMISSIONS" }, { status: 403 })
    }

    const body = await request.json()
    const data = createChannelSchema.parse(body)
    const workspaceId = data.workspaceId || context.workspaceId

    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace ID required", code: "WORKSPACE_ID_REQUIRED" }, { status: 400 })
    }

    if (data.departmentId) {
      const department = await prisma.workspaceDepartment.findFirst({
        where: {
          id: data.departmentId,
          workspaceId: workspaceId,
        },
      })

      if (!department) {
        return NextResponse.json({ error: "Department not found", code: "DEPARTMENT_NOT_FOUND" }, { status: 404 })
      }
    }

    const channel = await prisma.channel.create({
      data: {
        workspaceId: workspaceId,
        name: data.name,
        description: data.description,
        type: data.type,
        departmentId: data.departmentId,
        createdById: context.userId,
        icon: data.icon || "#",
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

    const ably = getAblyRest(); if (!ably) return NextResponse.json({ error: "Ably not configured" }, { status: 500 });
    if (ably) {
      const ablyChannel = ably.channels.get(`workspace:${workspaceId}`)
      await ablyChannel.publish("channel.created", { channel })
    }

    if (context.workspaceId) {
      await prisma.workspaceAuditLog.create({
        data: {
          workspaceId: workspaceId,
          userId: context.userId,
          action: "channel.created_via_api",
          resource: "channel",
          resourceId: channel.id,
          metadata: { name: data.name, type: data.type, authType: context.authType },
        },
      })
    }

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
        { error: "Invalid request body", code: "INVALID_REQUEST_BODY", details: error.issues },
        { status: 400 },
      )
    }
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 })
  }
}

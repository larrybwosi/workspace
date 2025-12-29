import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateWorkspaceApiKey, hasPermission, isRateLimitExceeded } from "@/lib/api-auth"
import { z } from "zod"

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["owner", "admin", "member", "guest"]).default("member"),
  departmentId: z.string().optional(),
  title: z.string().optional(),
  teamIds: z.array(z.string()).optional(),
})

/**
 * GET /api/v1/members
 * List all members (workspace ID derived from API token)
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

    if (!hasPermission(context, "read:members")) {
      return NextResponse.json({ error: "Forbidden", code: "INSUFFICIENT_PERMISSIONS" }, { status: 403 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "50"), 100)
    const departmentId = searchParams.get("departmentId")

    const where: any = { workspaceId: context.workspaceId }
    if (departmentId) {
      where.departmentId = departmentId
    }

    const [members, total] = await Promise.all([
      prisma.workspaceMember.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              status: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { joinedAt: "desc" },
      }),
      prisma.workspaceMember.count({ where }),
    ])

    return NextResponse.json(
      {
        members,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      {
        headers: {
          "X-RateLimit-Limit": context.rateLimit.toString(),
          "X-RateLimit-Remaining": (context.rateLimit - context.usageCount).toString(),
        },
      },
    )
  } catch (error) {
    console.error("[v0] Failed to list members via API:", error)
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 })
  }
}

/**
 * POST /api/v1/members
 * Add member(s) to workspace (workspace ID derived from API token)
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

    if (!hasPermission(context, "write:members")) {
      return NextResponse.json({ error: "Forbidden", code: "INSUFFICIENT_PERMISSIONS" }, { status: 403 })
    }

    const body = await request.json()
    const data = addMemberSchema.parse(body)

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.email.split("@")[0],
        },
      })
    }

    // Check if already a member
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: context.workspaceId,
          userId: user.id,
        },
      },
    })

    if (existingMember) {
      return NextResponse.json({ error: "User is already a member", code: "ALREADY_MEMBER" }, { status: 409 })
    }

    // Create member
    const member = await prisma.workspaceMember.create({
      data: {
        workspaceId: context.workspaceId,
        userId: user.id,
        role: data.role,
        departmentId: data.departmentId,
        title: data.title,
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
      },
    })

    // Log to audit trail
    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId: context.workspaceId,
        userId: context.userId,
        action: "member.added_via_api",
        resource: "member",
        resourceId: member.id,
        metadata: { email: data.email, role: data.role },
      },
    })

    return NextResponse.json(
      {
        success: true,
        member,
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
    console.error("[v0] Failed to add member via API:", error)
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 })
  }
}

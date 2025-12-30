import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateWorkspaceApiKey, hasPermission, isRateLimitExceeded } from "@/lib/api-auth"
import { z } from "zod"
import { sendRealtimeMessage } from "@/lib/ably"

// Helper to generate slugs
const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")

const createDepartmentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  managerId: z.string().optional(),
  parentId: z.string().optional(),
})

/**
 * GET /api/v1/departments
 * List all departments (workspace ID derived from API token)
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

    if (!hasPermission(context, "read:departments")) {
      return NextResponse.json({ error: "Forbidden", code: "INSUFFICIENT_PERMISSIONS" }, { status: 403 })
    }

    const departments = await prisma.workspaceDepartment.findMany({
      where: { workspaceId: context.workspaceId },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            members: true,
            channels: true,
            children: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(
      { departments },
      {
        headers: {
          "X-RateLimit-Limit": context.rateLimit.toString(),
          "X-RateLimit-Remaining": (context.rateLimit - context.usageCount).toString(),
        },
      },
    )
  } catch (error) {
    console.error("Failed to list departments via API:", error)
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 })
  }
}

/**
 * POST /api/v1/departments
 * Create a new department (workspace ID derived from API token)
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

    if (!hasPermission(context, "write:departments")) {
      return NextResponse.json({ error: "Forbidden", code: "INSUFFICIENT_PERMISSIONS" }, { status: 403 })
    }

    const body = await request.json()
    const data = createDepartmentSchema.parse(body)

    // Verify manager exists if provided
    if (data.managerId) {
      const manager = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: context.workspaceId,
          userId: data.managerId,
        },
      })

      if (!manager) {
        return NextResponse.json(
          { error: "Manager not found in workspace", code: "MANAGER_NOT_FOUND" },
          { status: 404 },
        )
      }
    }

    // Verify parent department exists if provided
    if (data.parentId) {
      const parent = await prisma.workspaceDepartment.findFirst({
        where: {
          id: data.parentId,
          workspaceId: context.workspaceId,
        },
      })

      if (!parent) {
        return NextResponse.json(
          { error: "Parent department not found", code: "PARENT_NOT_FOUND" },
          { status: 404 }
        )
      }
    }

    // Create department
    const department = await prisma.workspaceDepartment.create({
      data: {
        workspaceId: context.workspaceId,
        name: data.name,
        slug: slugify(data.name),
        description: data.description,
        managerId: data.managerId,
        parentId: data.parentId,
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    })

    // Send real-time notification
    await sendRealtimeMessage(`workspace:${context.workspaceId}`, "department.created", {
      department,
    })

    // Log to audit trail
    // Ensuring we use a consistent model name if provided in schema, 
    // assuming 'WorkspaceAuditLog' exists based on the provided snippet context.
    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId: context.workspaceId,
        userId: context.userId,
        action: "department.created_via_api",
        resource: "department",
        resourceId: department.id,
        metadata: { name: data.name, slug: department.slug },
      },
    })

    return NextResponse.json(
      {
        success: true,
        department,
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
    console.error("Failed to create department via API:", error)
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 })
  }
}
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getAblyServer, AblyChannels, EVENTS } from "@/lib/ably"

const createAnnouncementSchema = z.object({
  departmentId: z.string(),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional().default("normal"),
  pinned: z.boolean().optional().default(false),
  targetAudience: z
    .object({
      departments: z.array(z.string()).optional(),
      teams: z.array(z.string()).optional(),
      roles: z.array(z.string()).optional(),
    })
    .optional(),
})

async function validateApiToken(request: NextRequest, workspaceId: string) {
  const authHeader = request.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return null
  }

  const token = authHeader.slice(7)

  const apiToken = await prisma.workspaceApiToken.findUnique({
    where: { token },
  })

  if (!apiToken || apiToken.workspaceId !== workspaceId) {
    return null
  }

  if (apiToken.expiresAt && apiToken.expiresAt < new Date()) {
    return null
  }

  await prisma.workspaceApiToken.update({
    where: { id: apiToken.id },
    data: {
      lastUsedAt: new Date(),
      usageCount: { increment: 1 },
    },
  })

  return apiToken
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params
    const apiToken = await validateApiToken(request, workspaceId)

    if (!apiToken) {
      return NextResponse.json({ error: "Invalid or expired API token" }, { status: 401 })
    }

    const permissions = apiToken.permissions as any
    if (!permissions?.actions?.includes("write:announcements")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const data = createAnnouncementSchema.parse(body)

    // Verify department belongs to workspace
    const department = await prisma.workspaceDepartment.findUnique({
      where: { id: data.departmentId },
    })

    if (!department || department.workspaceId !== workspaceId) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 })
    }

    // Check department permission
    if (
      permissions.departments &&
      permissions.departments.length > 0 &&
      !permissions.departments.includes(data.departmentId)
    ) {
      return NextResponse.json({ error: "No permission for this department" }, { status: 403 })
    }

    const announcement = await prisma.departmentAnnouncement.create({
      data: {
        departmentId: data.departmentId,
        authorId: apiToken.createdById,
        title: data.title,
        content: data.content,
        priority: data.priority,
        pinned: data.pinned,
        targetAudience: data.targetAudience,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        department: { select: { id: true, name: true } },
      },
    })

    // Notify via Ably
    const ably = getAblyServer()
    const channel = ably.channels.get(AblyChannels.workspace(workspaceId))
    await channel.publish(EVENTS.WORKSPACE_UPDATED, {
      type: "announcement_created_via_api",
      announcement,
    })

    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId,
        userId: apiToken.createdById,
        action: "announcement.created_via_api",
        resource: "announcement",
        resourceId: announcement.id,
        metadata: {
          title: data.title,
          departmentId: data.departmentId,
          tokenName: apiToken.name,
        },
      },
    })

    return NextResponse.json(announcement, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("[v0] External API - Failed to create announcement:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

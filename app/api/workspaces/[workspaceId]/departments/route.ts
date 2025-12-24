import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { getAblyServer, AblyChannels, EVENTS } from "@/lib/ably"

const createDepartmentSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  parentId: z.string().optional(),
  managerId: z.string().optional(),
  settings: z.record(z.any()).optional(),
  createChannel: z.boolean().optional().default(true),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify membership
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
    })

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const departments = await prisma.workspaceDepartment.findMany({
      where: { workspaceId },
      include: {
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true, icon: true, color: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
        teams: { select: { id: true, name: true, icon: true, color: true } },
        _count: { select: { members: true, teams: true, announcements: true } },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(departments)
  } catch (error) {
    console.error("[v0] Failed to fetch departments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify admin/owner role
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
    })

    if (!member || !["owner", "admin"].includes(member.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const data = createDepartmentSchema.parse(body)

    // Check for duplicate slug
    const existing = await prisma.workspaceDepartment.findUnique({
      where: { workspaceId_slug: { workspaceId, slug: data.slug } },
    })

    if (existing) {
      return NextResponse.json({ error: "Department slug already exists" }, { status: 400 })
    }

    // Create department channel if requested
    let channelId: string | undefined
    if (data.createChannel) {
      const channel = await prisma.channel.create({
        data: {
          name: `dept-${data.slug}`,
          description: `${data.name} department channel`,
          type: "public",
          icon: data.icon || "building-2",
          workspaceId,
          createdById: session.user.id,
        },
      })
      channelId = channel.id
    }

    const department = await prisma.workspaceDepartment.create({
      data: {
        workspaceId,
        name: data.name,
        slug: data.slug,
        description: data.description,
        icon: data.icon,
        color: data.color,
        parentId: data.parentId,
        managerId: data.managerId,
        settings: data.settings,
        channelId,
      },
      include: {
        parent: true,
        members: { include: { user: true } },
        teams: true,
      },
    })

    // Audit log
    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId,
        userId: session.user.id,
        action: "department.created",
        resource: "department",
        resourceId: department.id,
        metadata: { name: data.name, slug: data.slug },
      },
    })

    // Notify workspace
    const ably = getAblyServer()
    const channel = ably.channels.get(AblyChannels.workspace(workspaceId))
    await channel.publish(EVENTS.WORKSPACE_UPDATED, {
      type: "department_created",
      department,
      userId: session.user.id,
    })

    return NextResponse.json(department, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("[v0] Failed to create department:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

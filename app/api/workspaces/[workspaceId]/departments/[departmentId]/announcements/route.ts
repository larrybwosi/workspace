import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { getAblyServer, AblyChannels, EVENTS } from "@/lib/ably"

const createAnnouncementSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional().default("normal"),
  pinned: z.boolean().optional().default(false),
  publishAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  targetAudience: z
    .object({
      departments: z.array(z.string()).optional(),
      teams: z.array(z.string()).optional(),
      roles: z.array(z.string()).optional(),
    })
    .optional(),
  attachments: z.array(z.any()).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; departmentId: string }> },
) {
  try {
    const { workspaceId, departmentId } = await params
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
    })

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const priority = searchParams.get("priority")

    const where: any = {
      departmentId,
      OR: [{ publishAt: null }, { publishAt: { lte: new Date() } }],
      AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }],
    }

    if (priority) {
      where.priority = priority
    }

    const [announcements, total] = await Promise.all([
      prisma.departmentAnnouncement.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.departmentAnnouncement.count({ where }),
    ])

    return NextResponse.json({
      announcements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Failed to fetch announcements:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; departmentId: string }> },
) {
  try {
    const { workspaceId, departmentId } = await params
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is department manager or admin
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
    })

    const department = await prisma.workspaceDepartment.findUnique({
      where: { id: departmentId },
    })

    const isManager = department?.managerId === session.user.id
    const isAdmin = member && ["owner", "admin"].includes(member.role)

    if (!isManager && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const data = createAnnouncementSchema.parse(body)

    const announcement = await prisma.departmentAnnouncement.create({
      data: {
        departmentId,
        authorId: session.user.id,
        title: data.title,
        content: data.content,
        priority: data.priority,
        pinned: data.pinned,
        publishAt: data.publishAt ? new Date(data.publishAt) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        targetAudience: data.targetAudience,
        attachments: data.attachments,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    })

    // Notify department members via Ably
    const ably = getAblyServer()
    const channel = ably.channels.get(AblyChannels.workspace(workspaceId))
    await channel.publish(EVENTS.WORKSPACE_UPDATED, {
      type: "announcement_created",
      announcement,
      departmentId,
    })

    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId,
        userId: session.user.id,
        action: "announcement.created",
        resource: "announcement",
        resourceId: announcement.id,
        metadata: { title: data.title, priority: data.priority },
      },
    })

    return NextResponse.json(announcement, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Failed to create announcement:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

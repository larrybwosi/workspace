import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { getAblyServer, AblyChannels, EVENTS } from "@/lib/ably"

const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  departmentId: z.string().optional(),
  leadId: z.string().optional(),
  memberIds: z.array(z.string()).optional(),
  createChannel: z.boolean().optional().default(true),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params
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
    const departmentId = searchParams.get("departmentId")

    const where: any = { workspaceId }
    if (departmentId) {
      where.departmentId = departmentId
    }

    const teams = await prisma.workspaceTeam.findMany({
      where,
      include: {
        department: { select: { id: true, name: true, icon: true, color: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true, status: true } },
          },
        },
        _count: { select: { members: true } },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ teams })
  } catch (error) {
    console.error("Failed to fetch teams:", error)
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

    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
    })

    if (!member || !["owner", "admin"].includes(member.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const data = createTeamSchema.parse(body)

    // Check for duplicate slug
    const existing = await prisma.workspaceTeam.findUnique({
      where: { workspaceId_slug: { workspaceId, slug: data.slug } },
    })

    if (existing) {
      return NextResponse.json({ error: "Team slug already exists" }, { status: 400 })
    }

    // Create team channel if requested
    let channelId: string | undefined
    if (data.createChannel) {
      const channel = await prisma.channel.create({
        data: {
          name: `team-${data.slug}`,
          description: `${data.name} team channel`,
          type: "private",
          icon: data.icon || "users",
          workspaceId,
          createdById: session.user.id,
        },
      })
      channelId = channel.id
    }

    const team = await prisma.workspaceTeam.create({
      data: {
        workspaceId,
        name: data.name,
        slug: data.slug,
        description: data.description,
        icon: data.icon,
        color: data.color,
        departmentId: data.departmentId,
        leadId: data.leadId,
        channelId,
      },
      include: {
        department: true,
        members: { include: { user: true } },
      },
    })

    // Add initial members
    if (data.memberIds && data.memberIds.length > 0) {
      await prisma.workspaceTeamMember.createMany({
        data: data.memberIds.map((userId) => ({
          teamId: team.id,
          userId,
          role: userId === data.leadId ? "lead" : "member",
        })),
      })
    }

    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId,
        userId: session.user.id,
        action: "team.created",
        resource: "team",
        resourceId: team.id,
        metadata: { name: data.name, memberCount: data.memberIds?.length || 0 },
      },
    })

    // Notify workspace
    const ably = getAblyServer()
    const channel = ably.channels.get(AblyChannels.workspace(workspaceId))
    await channel.publish(EVENTS.WORKSPACE_UPDATED, {
      type: "team_created",
      team,
    })

    return NextResponse.json(team, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Failed to create team:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

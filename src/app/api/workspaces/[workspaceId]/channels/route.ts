import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { getAblyServer, AblyChannels, EVENTS } from "@/lib/integrations/ably"

const createChannelSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  type: z.enum(["public", "private"]).default("public"),
  departmentId: z.string().optional(),
  icon: z.string().optional(),
})

async function getWorkspaceChannels(workspaceId: string, userId: string) {
  const channels = await prisma.channel.findMany({
    where: {
      workspaceId: workspaceId, // 1. Strict Workspace Isolation
      
      OR: [
        // Condition A: Public Channels (Everyone in workspace sees these)
        { isPrivate: false },
        
        // Condition B: Private Channels (Only members see these)
        { 
          isPrivate: true,
          members: {
            some: {
              userId: userId
            }
          }
        }
      ]
    },
    include: {
        // Optional: Get unread counts or last message
        _count: { select: { messages: true } }
    },
    orderBy: {
      name: 'asc'
    }
  })

  return channels
}

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

    const channels = await getWorkspaceChannels(workspaceId, session.user.id)


    return NextResponse.json(channels)
  } catch (error) {
    console.error("[WORKSPACE_CHANNELS_GET]", error)
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

    if (!member || !["owner", "admin", "member"].includes(member.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const data = createChannelSchema.parse(body)

    const channel = await prisma.channel.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type === "private" ? "private" : "public",
        icon: data.icon || "#",
        workspaceId,
        createdById: session.user.id,
        members: {
          create: { userId: session.user.id, role: "admin" },
        },
      },
      include: {
        members: { include: { user: true } },
      },
    })

    // Audit log
    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId,
        userId: session.user.id,
        action: "channel.created",
        resource: "channel",
        resourceId: channel.id,
        metadata: { name: data.name, type: data.type },
      },
    })

    // Notify workspace
    const ably = getAblyServer()
    const ablyChannel = ably.channels.get(AblyChannels.workspace(workspaceId))
    await ablyChannel.publish(EVENTS.CHANNEL_CREATED, { channel, userId: session.user.id })

    return NextResponse.json(channel, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("[WORKSPACE_CHANNELS_POST]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

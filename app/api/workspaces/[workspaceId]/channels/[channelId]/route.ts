import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { getAblyServer, AblyChannels, EVENTS } from "@/lib/ably"

const updateChannelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  type: z.enum(["public", "private"]).optional(),
  icon: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; channelId: string }> },
) {
  try {
    const { workspaceId, channelId } = await params
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

    const channel = await prisma.channel.findUnique({
      where: { id: channelId, workspaceId },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } },
        _count: { select: { members: true, threads: true } },
      },
    })

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 })
    }

    return NextResponse.json(channel)
  } catch (error) {
    console.error("[WORKSPACE_CHANNEL_GET]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; channelId: string }> },
) {
  try {
    const { workspaceId, channelId } = await params
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
    const data = updateChannelSchema.parse(body)

    const channel = await prisma.channel.update({
      where: { id: channelId, workspaceId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.type && { type: data.type }),
        ...(data.icon && { icon: data.icon }),
      },
      include: { members: { include: { user: true } } },
    })

    // Audit log
    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId,
        userId: session.user.id,
        action: "channel.updated",
        resource: "channel",
        resourceId: channelId,
        metadata: data,
      },
    })

    // Notify
    const ably = getAblyServer()
    const ablyChannel = ably.channels.get(AblyChannels.workspace(workspaceId))
    await ablyChannel.publish(EVENTS.CHANNEL_UPDATED, { channel, userId: session.user.id })

    return NextResponse.json(channel)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("[WORKSPACE_CHANNEL_PATCH]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; channelId: string }> },
) {
  try {
    const { workspaceId, channelId } = await params
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

    await prisma.channel.delete({ where: { id: channelId, workspaceId } })

    // Audit log
    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId,
        userId: session.user.id,
        action: "channel.deleted",
        resource: "channel",
        resourceId: channelId,
      },
    })

    // Notify
    const ably = getAblyServer()
    const ablyChannel = ably.channels.get(AblyChannels.workspace(workspaceId))
    await ablyChannel.publish(EVENTS.CHANNEL_DELETED, { channelId, userId: session.user.id })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[WORKSPACE_CHANNEL_DELETE]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

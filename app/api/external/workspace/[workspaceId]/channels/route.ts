import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getAblyServer, AblyChannels, EVENTS } from "@/lib/ably"

const createChannelSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(["public", "private"]).optional().default("public"),
  departmentId: z.string().optional(),
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
    data: { lastUsedAt: new Date(), usageCount: { increment: 1 } },
  })

  return apiToken
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params
    const apiToken = await validateApiToken(request, workspaceId)

    if (!apiToken) {
      return NextResponse.json({ error: "Invalid or expired API token" }, { status: 401 })
    }

    const permissions = apiToken.permissions as any
    if (!permissions?.actions?.includes("read:channels")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const channels = await prisma.workspaceChannel.findMany({
      where: { workspaceId },
      include: {
        department: { select: { id: true, name: true } },
        _count: { select: { messages: true, members: true } },
      },
    })

    return NextResponse.json({ channels })
  } catch (error) {
    console.error("External API - Failed to fetch channels:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params
    const apiToken = await validateApiToken(request, workspaceId)

    if (!apiToken) {
      return NextResponse.json({ error: "Invalid or expired API token" }, { status: 401 })
    }

    const permissions = apiToken.permissions as any
    if (!permissions?.actions?.includes("write:channels")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const data = createChannelSchema.parse(body)

    const channel = await prisma.workspaceChannel.create({
      data: {
        workspaceId,
        name: data.name,
        description: data.description,
        type: data.type,
        departmentId: data.departmentId,
        createdById: apiToken.createdById,
      },
    })

    const ably = getAblyServer()
    const ablyChannel = ably.channels.get(AblyChannels.workspace(workspaceId))
    await ablyChannel.publish(EVENTS.CHANNEL_CREATED, { channel })

    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId,
        userId: apiToken.createdById,
        action: "channel.created_via_api",
        resource: "channel",
        resourceId: channel.id,
        metadata: { channelName: data.name, tokenName: apiToken.name },
      },
    })

    return NextResponse.json({ success: true, channel }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("External API - Failed to create channel:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

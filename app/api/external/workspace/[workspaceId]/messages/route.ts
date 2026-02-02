import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"
import { getAblyServer, AblyChannels, EVENTS } from "@/lib/integrations/ably"

const messageSchema = z.object({
  channelId: z.string().min(1),
  content: z.string().min(1).max(4000),
  messageType: z.enum(["standard", "system", "bot", "integration", "alert"]).optional().default("integration"),
  metadata: z.record(z.any()).optional(),
  attachments: z
    .array(
      z.object({
        name: z.string(),
        type: z.string(),
        url: z.string().url(),
        size: z.number().optional(),
      }),
    )
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
    data: { lastUsedAt: new Date(), usageCount: { increment: 1 } },
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
    if (!permissions?.actions?.includes("send:messages")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const data = messageSchema.parse(body)

    // Verify channel exists and belongs to workspace
    const channel = await prisma.workspaceChannel.findFirst({
      where: { id: data.channelId, workspaceId },
    })

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 })
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        channelId: data.channelId,
        userId: apiToken.createdById,
        content: data.content,
        messageType: data.messageType,
        metadata: data.metadata || {},
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    })

    // Send real-time notification
    const ably = getAblyServer()
    const ablyChannel = ably.channels.get(AblyChannels.channel(data.channelId))
    await ablyChannel.publish(EVENTS.MESSAGE_CREATED, { message })

    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId,
        userId: apiToken.createdById,
        action: "message.sent_via_api",
        resource: "message",
        resourceId: message.id,
        metadata: { channelId: data.channelId, tokenName: apiToken.name },
      },
    })

    return NextResponse.json({ success: true, message }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("External API - Failed to send message:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { publishMessage } from "@/lib/ably"

// GET /api/dm/[conversationId]/messages - Get messages with pagination
export async function GET(request: NextRequest, { params }: { params: { conversationId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { conversationId } = await params
    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get("cursor")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    // Verify user is a member
    const dmConversation = await prisma.thread.findUnique({
      where: { id: conversationId },
      include: { members: true },
    })

    if (!dmConversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    const isMember = dmConversation.members.some((member) => member.id === session.user.id)

    if (!isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch messages with pagination
    const messages = await prisma.message.findMany({
      where: {
        threadId: conversationId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        reactions: true,
        attachments: true,
        mentions: true,
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: {
        timestamp: "desc",
      },
      take: limit,
      ...(cursor && {
        skip: 1,
        cursor: {
          id: cursor,
        },
      }),
    })

    const nextCursor = messages.length === limit ? messages[messages.length - 1].id : null

    return NextResponse.json({
      messages: messages.reverse(),
      nextCursor,
    })
  } catch (error) {
    console.error("[v0] Error fetching DM messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

// POST /api/dm/[conversationId]/messages - Send a new message
export async function POST(request: NextRequest, { params }: { params: { conversationId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { conversationId } = await params
    const body = await request.json()
    const { content, messageType = "standard", metadata, replyToId } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 })
    }

    // Verify user is a member
    const dmConversation = await prisma.thread.findUnique({
      where: { id: conversationId },
      include: { members: true },
    })

    if (!dmConversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    const isMember = dmConversation.members.some((member) => member.id === session.user.id)

    if (!isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        content,
        messageType,
        metadata,
        threadId: conversationId,
        userId: session.user.id,
        ...(replyToId && { replyToId, depth: 1 }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        reactions: true,
        attachments: true,
      },
    })

    // Update thread's updatedAt
    await prisma.thread.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    })

    // Publish message to Ably for real-time delivery
    await publishMessage(conversationId, {
      type: "message.new",
      data: message,
    })

    // Send notification to other member
    const otherMember = dmConversation.members.find((m) => m.id !== session.user.id)
    if (otherMember) {
      await prisma.notification.create({
        data: {
          userId: otherMember.id,
          type: "dm_message",
          title: `New message from ${session.user.name}`,
          message: content.substring(0, 100),
          entityType: "message",
          entityId: message.id,
          linkUrl: `/dm/${session.user.id}`,
          metadata: {
            senderId: session.user.id,
            senderName: session.user.name,
          },
        },
      })
    }

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error("[v0] Error sending DM message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}

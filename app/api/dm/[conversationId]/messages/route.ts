import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { getAblyRest, AblyChannels, AblyEvents } from "@/lib/integrations/ably"

export async function GET(
  request: NextRequest,
  { params }: { params: { dmId: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { dmId } = await params
    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get("cursor")
    const limit = parseInt(searchParams.get("limit") || "50")

    // Verify user is part of this DM
    const dm = await prisma.directMessage.findFirst({
      where: {
        id: dmId,
        OR: [
          { participant1Id: session.user.id },
          { participant2Id: session.user.id },
        ],
      },
    })

    if (!dm) {
      return NextResponse.json({ error: "DM not found" }, { status: 404 })
    }

    // Fetch messages with pagination
    const messages = await prisma.dMMessage.findMany({
      where: {
        dmId,
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      include: {
        attachments: true,
        reactions: true,
        readBy: true,
        replies: {
          include: {
            reactions: true,
            readBy: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit + 1,
    })

    const hasMore = messages.length > limit
    const data = hasMore ? messages.slice(0, limit) : messages
    const nextCursor = hasMore ? data[data.length - 1].createdAt.toISOString() : null

    // Add sender info
    const messagesWithSender = await Promise.all(
      data.map(async (msg) => {
        const sender = await prisma.user.findUnique({
          where: { id: msg.senderId },
          select: { id: true, name: true, avatar: true },
        })
        return { ...msg, sender }
      })
    )

    return NextResponse.json({
      messages: messagesWithSender.reverse(),
      nextCursor,
      hasMore,
    })
  } catch (error) {
    console.error(" Error fetching DM messages:", error)
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { dmId: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { dmId } = await params
    const { content, replyToId, attachments } = await request.json()

    // Verify user is part of this DM
    const dm = await prisma.directMessage.findFirst({
      where: {
        id: dmId,
        OR: [
          { participant1Id: session.user.id },
          { participant2Id: session.user.id },
        ],
      },
    })

    if (!dm) {
      return NextResponse.json({ error: "DM not found" }, { status: 404 })
    }

    // Create message
    const message = await prisma.dMMessage.create({
      data: {
        dmId,
        senderId: session.user.id,
        content,
        replyToId,
        attachments: attachments
          ? {
              create: attachments.map((att: any) => ({
                name: att.name,
                type: att.type,
                url: att.url,
                size: att.size,
              })),
            }
          : undefined,
      },
      include: {
        attachments: true,
        reactions: true,
        readBy: true,
      },
    })

    // Update DM lastMessageAt
    await prisma.directMessage.update({
      where: { id: dmId },
      data: { lastMessageAt: new Date() },
    })

    // Get sender info
    const sender = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, avatar: true },
    })

    // Send real-time notification
    const ably = getAblyRest()
    const channel = ably.channels.get(AblyChannels.dm(dmId))
    await channel.publish(AblyEvents.MESSAGE_SENT, {
      ...message,
      sender,
    })

    // Notify the other user
    const otherUserId =
      dm.participant1Id === session.user.id
        ? dm.participant2Id
        : dm.participant1Id
    const userChannel = ably.channels.get(AblyChannels.user(otherUserId))
    await userChannel.publish(AblyEvents.DM_RECEIVED, {
      dmId,
      message: { ...message, sender },
    })

    return NextResponse.json({ ...message, sender }, { status: 201 })
  } catch (error) {
    console.error(" Error sending DM message:", error)
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    )
  }
}

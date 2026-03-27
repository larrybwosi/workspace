import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { getAblyRest, AblyChannels, AblyEvents } from "@/lib/integrations/ably"

/**
 * POST /api/messages/[messageId]/replies
 *
 * Creates a new reply for a specific message.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ messageId: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // This is the ID of the message being replied to
    const { messageId: parentMessageId } = await params
    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // 1. Find the parent message to get its threadId and depth
    const parentMessage = await prisma.message.findUnique({
      where: { id: parentMessageId },
    })

    if (!parentMessage) {
      return NextResponse.json({ error: "Parent message not found" }, { status: 404 })
    }

    // 2. Create the new reply message
    const newReply = await prisma.message.create({
      data: {
        content,
        channelId: parentMessage.channelId,
        threadId: parentMessage.threadId,
        userId: session.user.id,
        replyToId: parentMessageId,
        depth: parentMessage.depth + 1,
      },
      include: {
        user: true,
        reactions: true,
      },
    })

    // 3. Broadcast the new reply via Ably
    const ably = getAblyRest()
    const channelId = parentMessage.channelId || "default"
    const channel = ably.channels.get(AblyChannels.thread(channelId))

    // Publish a "message created" event.
    await channel.publish(AblyEvents.MESSAGE_SENT, newReply)

    return NextResponse.json(newReply, { status: 201 }) // 201 Created
  } catch (error) {
    console.error("Reply error:", error)
    return NextResponse.json({ error: "Failed to post reply" }, { status: 500 })
  }
}
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getAblyRest, AblyChannels, AblyEvents } from "@/lib/ably"

/**
 * POST /api/messages/[messageId]/replies
 *
 * Creates a new reply for a specific message.
 */
export async function POST(request: NextRequest, { params }: { params: { messageId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // This is the ID of the message being replied to
    const { messageId: parentMessageId } = params
    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // 1. Find the parent message to get its threadId and depth
    // The parent message (the one being replied to) is in the 'Message' model [cite: 145]
    const parentMessage = await prisma.message.findUnique({
      where: { id: parentMessageId },
    })

    if (!parentMessage) {
      return NextResponse.json({ error: "Parent message not found" }, { status: 404 })
    }

    // 2. Create the new reply message
    // A reply is a 'Message' with 'replyToId' [cite: 147] and 'depth' [cite: 148] set
    const newReply = await prisma.message.create({
      data: {
        content,
        threadId: parentMessage.threadId, // All replies belong to the same thread [cite: 145]
        userId: session.user.id, // The user creating the reply [cite: 145]
        replyToId: parentMessageId, // Link to the parent message [cite: 147]
        depth: parentMessage.depth + 1, // Increment depth for nesting [cite: 148]
      },
      include: {
        user: true, // Include the sender's info
        reactions: true, // Include empty reactions array for the client
      },
    })

    // 3. Broadcast the new reply via Ably
    const ably = getAblyRest()
    const channel = ably.channels.get(AblyChannels.thread(parentMessage.threadId))

    // Publish a "message created" event.
    // The client will use the `replyToId` to place it in the UI.
    await channel.publish(AblyEvents.MESSAGE_SENT, newReply)

    return NextResponse.json(newReply, { status: 201 }) // 201 Created
  } catch (error) {
    console.error("Reply error:", error)
    return NextResponse.json({ error: "Failed to post reply" }, { status: 500 })
  }
}
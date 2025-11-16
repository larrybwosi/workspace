import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getAblyRest, AblyChannels, AblyEvents } from "@/lib/ably"

export async function POST(request: NextRequest, { params }: { params: { messageId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { messageId } = await params
    const body = await request.json()
    const { emoji } = body

    // Check if reaction already exists
    const existing = await prisma.reaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId: session.user.id,
          emoji,
        },
      },
    })

    if (existing) {
      // Remove reaction
      await prisma.reaction.delete({
        where: { id: existing.id },
      })
    } else {
      // Add reaction
      await prisma.reaction.create({
        data: {
          messageId,
          userId: session.user.id,
          emoji,
        },
      })
    }

    // Get message with updated reactions
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        reactions: true,
      },
    })

    // Broadcast reaction update via Ably
    const ably = getAblyRest()
    const channel = ably.channels.get(AblyChannels.thread(message!.threadId))
    await channel.publish(AblyEvents.MESSAGE_REACTION, {
      messageId,
      reactions: message!.reactions,
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error("[v0] Reaction error:", error)
    return NextResponse.json({ error: "Failed to update reaction" }, { status: 500 })
  }
}

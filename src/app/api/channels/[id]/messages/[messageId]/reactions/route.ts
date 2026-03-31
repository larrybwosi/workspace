import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { getAblyRest, AblyChannels, AblyEvents } from "@/lib/integrations/ably"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; messageId: string }> }) {
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

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    // Broadcast reaction update via Ably
    const ably = getAblyRest(); if (!ably) return NextResponse.json({ error: "Ably not configured" }, { status: 500 });
    if (ably) {
      const channelId = message.channelId || "default"
      const channel = ably.channels.get(AblyChannels.thread(channelId))
      await channel.publish(AblyEvents.MESSAGE_REACTION, {
        messageId,
        reactions: message.reactions,
      })
    }

    return NextResponse.json(message)
  } catch (error) {
    console.error(" Reaction error:", error)
    return NextResponse.json({ error: "Failed to update reaction" }, { status: 500 })
  }
}

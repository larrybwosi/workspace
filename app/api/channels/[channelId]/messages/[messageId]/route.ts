import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getAblyRest, AblyChannels, AblyEvents } from "@/lib/ably"

export async function PATCH(request: NextRequest, { params }: { params: { messageId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { messageId } = await params
    const body = await request.json()
    const { content } = body

    // Verify ownership
    const existingMessage = await prisma.message.findUnique({
      where: { id: messageId },
    })

    if (!existingMessage || existingMessage.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const message = await prisma.message.update({
      where: { id: messageId },
      data: {
        content,
        isEdited: true,
      },
      include: {
        user: true,
        reactions: true,
        attachments: true,
        mentions: true,
      },
    })

    // Broadcast update via Ably
    const ably = getAblyRest()
    const channel = ably.channels.get(AblyChannels.thread(message.threadId))
    await channel.publish(AblyEvents.MESSAGE_UPDATED, message)

    return NextResponse.json(message)
  } catch (error) {
    console.error("[v0] Message update error:", error)
    return NextResponse.json({ error: "Failed to update message" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { messageId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { messageId } = await params

    // Verify ownership
    const existingMessage = await prisma.message.findUnique({
      where: { id: messageId },
    })

    if (!existingMessage || existingMessage.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.message.delete({
      where: { id: messageId },
    })

    // Broadcast deletion via Ably
    const ably = getAblyRest()
    const channel = ably.channels.get(AblyChannels.thread(existingMessage.threadId))
    await channel.publish(AblyEvents.MESSAGE_DELETED, { messageId })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Message deletion error:", error)
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 })
  }
}

import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { getAblyRest, AblyChannels, AblyEvents } from "@/lib/integrations/ably"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; messageId: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() } as any)
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
    const ably = getAblyRest(); if (!ably) return NextResponse.json({ error: "Ably not configured" }, { status: 500 });
    if (ably) {
      const channel = ably.channels.get(AblyChannels.thread(message.channelId))
      await channel.publish(AblyEvents.MESSAGE_UPDATED, message)
    }

    return NextResponse.json(message)
  } catch (error) {
    console.error(" Message update error:", error)
    return NextResponse.json({ error: "Failed to update message" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() } as any)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { messageId } = await params

    // 1. Fetch relations to make "smart" decisions
    const existingMessage = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        rootThread: true, // Check if this message starts a thread
        attachments: true, // Get file keys for storage cleanup
        _count: {
          select: { replies: true } // Check if it has replies
        }
      }
    })

    if (!existingMessage) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 })
    }

    // 2. Ownership & Admin Verification
    if (existingMessage.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const channelId = existingMessage.channelId

    // 3. Handle Storage Cleanup (Crucial to save money)
    if (existingMessage.attachments.length > 0) {
      console.log(`[TODO] Delete ${existingMessage.attachments.length} files from storage`)
    }

    // 4. SMART DELETE LOGIC
    
    // Scenario A: Message starts a thread
    if (existingMessage.rootThread) {
      await prisma.thread.delete({
        where: { id: existingMessage.rootThread.id }
      })
    } 
    // Scenario B: Message has replies (but isn't a thread root)
    else if (existingMessage._count.replies > 0) {
      await prisma.message.update({
        where: { id: messageId },
        data: {
          content: "[Message Deleted]",
          attachments: { deleteMany: {} },
          isEdited: true,
        }
      })
    } 
    // Scenario C: Standard Leaf Message
    else {
      await prisma.message.delete({
        where: { id: messageId },
      })
    }

    // 5. Broadcast deletion via Ably
    const ably = getAblyRest(); if (!ably) return NextResponse.json({ error: "Ably not configured" }, { status: 500 });
    if (ably) {
      const channel = ably.channels.get(AblyChannels.thread(channelId))
      await channel.publish(AblyEvents.MESSAGE_DELETED, {
        messageId,
        threadId: existingMessage.rootThread?.id
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Message deletion error:", error)
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 })
  }
}

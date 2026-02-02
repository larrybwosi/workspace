import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { getAblyRest, AblyChannels, AblyEvents } from "@/lib/integrations/ably"

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
    const channel = ably.channels.get(AblyChannels.thread(message.channelId))
    await channel.publish(AblyEvents.MESSAGE_UPDATED, message)

    return NextResponse.json(message)
  } catch (error) {
    console.error(" Message update error:", error)
    return NextResponse.json({ error: "Failed to update message" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ messageId: string }> } 
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
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
    // (Optional: Add `session.user.role === 'Admin'` if admins should be able to delete)
    if (existingMessage.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const channelId = existingMessage.channelId

    // 3. Handle Storage Cleanup (Crucial to save money)
    if (existingMessage.attachments.length > 0) {
      // Run in background so request doesn't hang
      // await deleteFilesFromS3(existingMessage.attachments.map(a => a.url));
      console.log(`[TODO] Delete ${existingMessage.attachments.length} files from storage`)
    }

    // 4. SMART DELETE LOGIC
    
    // Scenario A: Message starts a thread
    if (existingMessage.rootThread) {
      // OPTION 1: Delete the whole thread (Cleanest)
      await prisma.thread.delete({
        where: { id: existingMessage.rootThread.id }
      })
      // Ably: You might need to broadcast THREAD_DELETED instead
    } 
    // Scenario B: Message has replies (but isn't a thread root)
    else if (existingMessage._count.replies > 0) {
      // OPTION: Soft Delete (Preserve tree structure)
      // Hard deleting a parent message often breaks UI conversation flow
      await prisma.message.update({
        where: { id: messageId },
        data: {
          content: "[Message Deleted]",
          attachments: { deleteMany: {} }, // Remove attachments from DB
          isEdited: true,
          // You might want a 'deletedAt' field in your schema for this
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
    const ably = getAblyRest()
    const channel = ably.channels.get(AblyChannels.thread(channelId))
    await channel.publish(AblyEvents.MESSAGE_DELETED, { 
      messageId,
      // Useful for frontend to remove thread UI if needed
      threadId: existingMessage.rootThread?.id 
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Message deletion error:", error)
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 })
  }
}
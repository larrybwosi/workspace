import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/dm/[conversationId] - Get specific DM conversation
export async function GET(request: NextRequest, { params }: { params: { conversationId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { conversationId } = await params

    const dmConversation = await prisma.thread.findUnique({
      where: {
        id: conversationId,
      },
      include: {
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            status: true,
            role: true,
          },
        },
        messages: {
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
          },
          orderBy: {
            timestamp: "asc",
          },
        },
      },
    })

    if (!dmConversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Verify user is a member of this DM
    const isMember = dmConversation.members.some((member) => member.id === session.user.id)

    if (!isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(dmConversation)
  } catch (error) {
    console.error("[v0] Error fetching DM conversation:", error)
    return NextResponse.json({ error: "Failed to fetch conversation" }, { status: 500 })
  }
}

// DELETE /api/dm/[conversationId] - Delete DM conversation
export async function DELETE(request: NextRequest, { params }: { params: { conversationId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { conversationId } = await params

    // Verify user is a member
    const dmConversation = await prisma.thread.findUnique({
      where: {
        id: conversationId,
      },
      include: {
        members: true,
      },
    })

    if (!dmConversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    const isMember = dmConversation.members.some((member) => member.id === session.user.id)

    if (!isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete the conversation
    await prisma.thread.delete({
      where: {
        id: conversationId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting DM conversation:", error)
    return NextResponse.json({ error: "Failed to delete conversation" }, { status: 500 })
  }
}

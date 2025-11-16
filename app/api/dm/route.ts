import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/dm - Get all DM conversations for current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all threads where type is DM and user is a member
    const dmConversations = await prisma.thread.findMany({
      where: {
        channelId: {
          startsWith: "dm-",
        },
        members: {
          some: {
            id: session.user.id,
          },
        },
      },
      include: {
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            status: true,
          },
        },
        messages: {
          take: 1,
          orderBy: {
            timestamp: "desc",
          },
          select: {
            id: true,
            content: true,
            timestamp: true,
            userId: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    })

    return NextResponse.json(dmConversations)
  } catch (error) {
    console.error("[v0] Error fetching DM conversations:", error)
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 })
  }
}

// POST /api/dm - Create a new DM conversation
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Check if conversation already exists
    const existingThread = await prisma.thread.findFirst({
      where: {
        channelId: `dm-${userId}`,
        members: {
          some: {
            id: session.user.id,
          },
        },
      },
      include: {
        members: true,
      },
    })

    if (existingThread) {
      return NextResponse.json(existingThread)
    }

    // Create new DM thread
    const dmThread = await prisma.thread.create({
      data: {
        title: "Direct Message",
        channelId: `dm-${userId}`,
        creatorId: session.user.id,
        status: "Active",
        members: {
          connect: [{ id: session.user.id }, { id: userId }],
        },
      },
      include: {
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            status: true,
          },
        },
      },
    })

    return NextResponse.json(dmThread, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating DM conversation:", error)
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
  }
}

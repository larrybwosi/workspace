import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { publishToAbly } from "@/lib/integrations/ably"
import { z } from "zod"

const friendRequestSchema = z.object({
  receiverId: z.string(),
  message: z.string().optional(),
})

// GET /api/friends/requests - Get friend requests
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") // "sent" or "received"
    const status = searchParams.get("status") // "pending", "accepted", "declined"

    const where: any = {
      ...(status && { status }),
    }

    if (type === "sent") {
      where.senderId = session.user.id
    } else if (type === "received") {
      where.receiverId = session.user.id
    } else {
      // Return both sent and received if type not specified
      where.OR = [{ senderId: session.user.id }, { receiverId: session.user.id }]
    }

    const requests = await prisma.friendRequest.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            image: true,
            status: true,
            role: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            image: true,
            status: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ requests })
  } catch (error) {
    console.error("Error fetching friend requests:", error)
    return NextResponse.json({ error: "Failed to fetch friend requests" }, { status: 500 })
  }
}

// POST /api/friends/requests - Send friend request
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = friendRequestSchema.parse(body)


    // Check if receiver exists
    const receiver = await prisma.user.findUnique({
      where: { email: validatedData.receiverId },
    })

    if (!receiver) {
      console.error("Receiver user not found:", validatedData.receiverId)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const receiverId = receiver.id;

    // Cannot send friend request to yourself
    if (validatedData.receiverId === session.user.id) {
      return NextResponse.json({ error: "Cannot send friend request to yourself" }, { status: 400 })
    }
    // Check if already friends
    const existingFriend = await prisma.friend.findFirst({
      where: {
        OR: [
          { userId: session.user.id, friendId: receiverId },
          { userId: receiverId, friendId: session.user.id },
        ],
      },
    })

    if (existingFriend) {
      return NextResponse.json({ error: "Already friends with this user" }, { status: 400 })
    }

    // Check if request already exists
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: session.user.id, receiverId: receiverId, status: "pending" },
          { senderId: receiverId, receiverId: session.user.id, status: "pending" },
        ],
      },
    })

    if (existingRequest) {
      return NextResponse.json({ error: "Friend request already pending" }, { status: 400 })
    }

    // Create friend request
    const friendRequest = await prisma.friendRequest.create({
      data: {
        senderId: session.user.id,
        receiverId: receiverId,
        message: validatedData.message,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            image: true,
            status: true,
            role: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            image: true,
            status: true,
            role: true,
          },
        },
      },
    })

    // Create notification for receiver
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: "friend_request",
        title: "New Friend Request",
        message: `${session.user.name} sent you a friend request`,
        entityType: "friend_request",
        entityId: friendRequest.id,
        linkUrl: `/friends/requests`,
        metadata: {
          senderId: session.user.id,
          senderName: session.user.name,
          message: validatedData.message,
        },
      },
    })

    // Send real-time notification via Ably
    await publishToAbly(`user:${receiverId}`, "NOTIFICATION", {
      type: "friend_request",
      title: "New Friend Request",
      message: `${session.user.name} sent you a friend request`,
      entityType: "friend_request",
      entityId: friendRequest.id,
      linkUrl: `/friends/requests`,
    })

    return NextResponse.json({ request: friendRequest })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error("Error creating friend request:", error)
    return NextResponse.json({ error: "Failed to send friend request" }, { status: 500 })
  }
}

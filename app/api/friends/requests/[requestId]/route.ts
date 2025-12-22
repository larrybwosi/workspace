import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { publishToAbly } from "@/lib/ably"
import { z } from "zod"

const actionSchema = z.object({
  action: z.enum(["accept", "decline", "cancel"]),
})

// PATCH /api/friends/requests/[requestId] - Accept/Decline/Cancel friend request
export async function PATCH(request: NextRequest, { params }: { params: { requestId: string } }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action } = actionSchema.parse(body)

    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: params.requestId },
      include: {
        sender: true,
        receiver: true,
      },
    })

    if (!friendRequest) {
      return NextResponse.json({ error: "Friend request not found" }, { status: 404 })
    }

    // Validate permissions
    if (action === "cancel" && friendRequest.senderId !== session.user.id) {
      return NextResponse.json({ error: "Only sender can cancel the request" }, { status: 403 })
    }

    if ((action === "accept" || action === "decline") && friendRequest.receiverId !== session.user.id) {
      return NextResponse.json({ error: "Only receiver can accept or decline the request" }, { status: 403 })
    }

    if (friendRequest.status !== "pending") {
      return NextResponse.json({ error: "Request has already been processed" }, { status: 400 })
    }

    // Update request status
    const updatedRequest = await prisma.friendRequest.update({
      where: { id: params.requestId },
      data: {
        status: action === "accept" ? "accepted" : action === "decline" ? "declined" : "cancelled",
        respondedAt: action !== "cancel" ? new Date() : undefined,
      },
    })

    // If accepted, create friendship (bidirectional)
    if (action === "accept") {
      await prisma.$transaction([
        prisma.friend.create({
          data: {
            userId: friendRequest.senderId,
            friendId: friendRequest.receiverId,
          },
        }),
        prisma.friend.create({
          data: {
            userId: friendRequest.receiverId,
            friendId: friendRequest.senderId,
          },
        }),
      ])

      // Notify sender that request was accepted
      await prisma.notification.create({
        data: {
          userId: friendRequest.senderId,
          type: "friend_request_accepted",
          title: "Friend Request Accepted",
          message: `${friendRequest.receiver.name} accepted your friend request`,
          entityType: "friend",
          entityId: friendRequest.receiverId,
          linkUrl: `/friends`,
        },
      })

      await publishToAbly(`user:${friendRequest.senderId}`, "NOTIFICATION", {
        type: "friend_request_accepted",
        title: "Friend Request Accepted",
        message: `${friendRequest.receiver.name} accepted your friend request`,
        entityType: "friend",
        entityId: friendRequest.receiverId,
        linkUrl: `/friends`,
      })
    } else if (action === "decline") {
      // Notify sender that request was declined
      await prisma.notification.create({
        data: {
          userId: friendRequest.senderId,
          type: "friend_request_declined",
          title: "Friend Request Declined",
          message: `${friendRequest.receiver.name} declined your friend request`,
          entityType: "friend_request",
          entityId: params.requestId,
        },
      })

      await publishToAbly(`user:${friendRequest.senderId}`, "NOTIFICATION", {
        type: "friend_request_declined",
        title: "Friend Request Declined",
        message: `${friendRequest.receiver.name} declined your friend request`,
      })
    }

    return NextResponse.json({ request: updatedRequest })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error("[v0] Error processing friend request:", error)
    return NextResponse.json({ error: "Failed to process friend request" }, { status: 500 })
  }
}

// DELETE /api/friends/requests/[requestId] - Delete friend request
export async function DELETE(request: NextRequest, { params }: { params: { requestId: string } }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: params.requestId },
    })

    if (!friendRequest) {
      return NextResponse.json({ error: "Friend request not found" }, { status: 404 })
    }

    // Only sender or receiver can delete
    if (friendRequest.senderId !== session.user.id && friendRequest.receiverId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized to delete this request" }, { status: 403 })
    }

    await prisma.friendRequest.delete({
      where: { id: params.requestId },
    })

    return NextResponse.json({ message: "Friend request deleted" })
  } catch (error) {
    console.error("[v0] Error deleting friend request:", error)
    return NextResponse.json({ error: "Failed to delete friend request" }, { status: 500 })
  }
}

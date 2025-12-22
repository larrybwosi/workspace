import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { z } from "zod"

const updateFriendSchema = z.object({
  nickname: z.string().optional(),
})

// PATCH /api/friends/[friendId] - Update friend (e.g., set nickname)
export async function PATCH(request: NextRequest, { params }: { params: { friendId: string } }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { nickname } = updateFriendSchema.parse(body)

    const friend = await prisma.friend.findFirst({
      where: {
        userId: session.user.id,
        friendId: params.friendId,
      },
    })

    if (!friend) {
      return NextResponse.json({ error: "Friend not found" }, { status: 404 })
    }

    const updatedFriend = await prisma.friend.update({
      where: { id: friend.id },
      data: { nickname },
      include: {
        friend: {
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

    return NextResponse.json({ friend: updatedFriend })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error("[v0] Error updating friend:", error)
    return NextResponse.json({ error: "Failed to update friend" }, { status: 500 })
  }
}

// DELETE /api/friends/[friendId] - Remove friend
export async function DELETE(request: NextRequest, { params }: { params: { friendId: string } }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete both friendship records (bidirectional)
    await prisma.$transaction([
      prisma.friend.deleteMany({
        where: {
          userId: session.user.id,
          friendId: params.friendId,
        },
      }),
      prisma.friend.deleteMany({
        where: {
          userId: params.friendId,
          friendId: session.user.id,
        },
      }),
    ])

    return NextResponse.json({ message: "Friend removed" })
  } catch (error) {
    console.error("[v0] Error removing friend:", error)
    return NextResponse.json({ error: "Failed to remove friend" }, { status: 500 })
  }
}

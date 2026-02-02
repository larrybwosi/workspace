import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { getAblyRest, AblyChannels, AblyEvents } from "@/lib/integrations/ably"
import { z } from "zod"

const assignBadgeSchema = z.object({
  userId: z.string(),
  badgeId: z.string(),
  reason: z.string().optional(),
  isPrimary: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { userId, badgeId, reason, isPrimary } = assignBadgeSchema.parse(body)

    // Check if already assigned
    const existing = await prisma.userBadgeAssignment.findUnique({
      where: {
        userId_badgeId: { userId, badgeId },
      },
    })

    if (existing) {
      return NextResponse.json({ error: "Badge already assigned" }, { status: 400 })
    }

    // If setting as primary, unset other primary badges
    if (isPrimary) {
      await prisma.userBadgeAssignment.updateMany({
        where: { userId, isPrimary: true },
        data: { isPrimary: false },
      })
    }

    const assignment = await prisma.userBadgeAssignment.create({
      data: {
        userId,
        badgeId,
        assignedBy: session.user.id,
        reason,
        isPrimary: isPrimary || false,
      },
      include: {
        badge: true,
      },
    })

    // Notify user via Ably
    const ably = getAblyRest()
    const channel = ably.channels.get(AblyChannels.user(userId))
    await channel.publish(AblyEvents.NOTIFICATION, {
      type: "badge_earned",
      badge: assignment.badge,
      reason,
    })

    return NextResponse.json(assignment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Assign badge error:", error)
    return NextResponse.json({ error: "Failed to assign badge" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const badgeId = searchParams.get("badgeId")

    if (!userId || !badgeId) {
      return NextResponse.json({ error: "Missing userId or badgeId" }, { status: 400 })
    }

    await prisma.userBadgeAssignment.delete({
      where: {
        userId_badgeId: { userId, badgeId },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Revoke badge error:", error)
    return NextResponse.json({ error: "Failed to revoke badge" }, { status: 500 })
  }
}

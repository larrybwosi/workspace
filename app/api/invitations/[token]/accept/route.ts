import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { isInvitationExpired } from "@/lib/utils/invitation-utils"
import { auth } from "@/lib/auth"

// POST /api/invitations/[token]/accept - Accept invitation
export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const { token } = await params
    const body = await request.json()
    const { name, password } = body

    if (!name || !password) {
      return NextResponse.json({ error: "Name and password are required" }, { status: 400 })
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token },
    })

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    if (invitation.status !== "pending") {
      return NextResponse.json({ error: "Invitation is no longer valid" }, { status: 400 })
    }

    if (isInvitationExpired(invitation.expiresAt)) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "expired" },
      })

      return NextResponse.json({ error: "Invitation has expired" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    })

    if (existingUser) {
      return NextResponse.json({ error: "User already exists with this email" }, { status: 400 })
    }

    // Create user account
    const { user } = await auth.api.createUser({
        body: {
        name,
        email: invitation.email,
        password,
      },
    })

    // Add user to project/channel if specified
    if (invitation.projectId) {
      await prisma.project.update({
        where: { id: invitation.projectId },
        data: {
          members: {
            connect: { id: user.id },
          },
        },
      })
    }

    if (invitation.channelId) {
      await prisma.channelMember.create({
        data: {
          channelId: invitation.channelId,
          userId: user.id,
          role: invitation.role,
        },
      })
    }

    // Update invitation status
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        status: "accepted",
        acceptedAt: new Date(),
      },
    })

    // Log acceptance
    await prisma.invitationLog.create({
      data: {
        invitationId: invitation.id,
        action: "accepted",
        metadata: { userId: user.id },
      },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    console.error(" Error accepting invitation:", error)
    return NextResponse.json({ error: "Failed to accept invitation" }, { status: 500 })
  }
}

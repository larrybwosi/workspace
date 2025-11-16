import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isInvitationExpired } from "@/lib/invitation-utils"

// GET /api/invitations/[token] - Get invitation details
export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const { token } = await params

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        // Include related data for display
      },
    })

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    if (invitation.status !== "pending") {
      return NextResponse.json({ error: "Invitation is no longer valid", status: invitation.status }, { status: 400 })
    }

    if (isInvitationExpired(invitation.expiresAt)) {
      // Update invitation status
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "expired" },
      })

      return NextResponse.json({ error: "Invitation has expired" }, { status: 400 })
    }

    // Get inviter details
    const inviter = await prisma.user.findUnique({
      where: { id: invitation.invitedBy },
      select: { name: true, avatar: true },
    })

    // Get project details if applicable
    let project = null
    if (invitation.projectId) {
      project = await prisma.project.findUnique({
        where: { id: invitation.projectId },
        select: { name: true, icon: true, description: true },
      })
    }

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        inviter,
        project,
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching invitation:", error)
    return NextResponse.json({ error: "Failed to fetch invitation" }, { status: 500 })
  }
}

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
    const user = await prisma.user.create({
      data: {
        email: invitation.email,
        name,
        role: invitation.role,
        emailVerified: true,
      },
    })

    // Create account with password
    await prisma.account.create({
      data: {
        userId: user.id,
        accountId: user.email,
        providerId: "credential",
        password, // Note: Better-auth will hash this
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
    console.error("[v0] Error accepting invitation:", error)
    return NextResponse.json({ error: "Failed to accept invitation" }, { status: 500 })
  }
}

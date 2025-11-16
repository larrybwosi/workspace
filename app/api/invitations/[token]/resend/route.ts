import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { generateInvitationLink, sendInvitationEmail } from "@/lib/invitation-utils"

// POST /api/invitations/[token]/resend - Resend invitation
export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { token } = await params

    const invitation = await prisma.invitation.findUnique({
      where: { token },
    })

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    if (invitation.invitedBy !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (invitation.status !== "pending") {
      return NextResponse.json({ error: "Can only resend pending invitations" }, { status: 400 })
    }

    const invitationLink = generateInvitationLink(token)

    // Get project name if applicable
    let projectName: string | undefined
    if (invitation.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: invitation.projectId },
        select: { name: true },
      })
      projectName = project?.name
    }

    // Resend invitation email
    await sendInvitationEmail(invitation.email, invitationLink, session.user.name, projectName)

    // Log resend action
    await prisma.invitationLog.create({
      data: {
        invitationId: invitation.id,
        action: "resent",
        metadata: { resentBy: session.user.id },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error resending invitation:", error)
    return NextResponse.json({ error: "Failed to resend invitation" }, { status: 500 })
  }
}

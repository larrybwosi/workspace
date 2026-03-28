import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params

    const inviteLink = await prisma.workspaceInviteLink.findUnique({
      where: { code },
      include: {
        workspace: true,
      },
    })

    if (!inviteLink) {
      return NextResponse.json({ error: "Invalid invite link" }, { status: 404 })
    }

    // Check expiration
    if (inviteLink.expiresAt && inviteLink.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invite link has expired" }, { status: 400 })
    }

    // Check max uses
    if (inviteLink.maxUses && inviteLink.maxUses > 0 && inviteLink.uses >= inviteLink.maxUses) {
      return NextResponse.json({ error: "Invite link has reached its use limit" }, { status: 400 })
    }

    return NextResponse.json(inviteLink)
  } catch (error) {
    console.error(" Invite link validation error:", error)
    return NextResponse.json({ error: "Failed to validate invite link" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { code } = params

    const inviteLink = await prisma.workspaceInviteLink.findUnique({
      where: { code },
      include: { workspace: true },
    })

    if (!inviteLink) {
      return NextResponse.json({ error: "Invalid invite link" }, { status: 404 })
    }

    // Expiration check
    if (inviteLink.expiresAt && inviteLink.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invite link has expired" }, { status: 400 })
    }

    // Use limit check
    if (inviteLink.maxUses && inviteLink.maxUses > 0 && inviteLink.uses >= inviteLink.maxUses) {
      return NextResponse.json({ error: "Invite link has reached its use limit" }, { status: 400 })
    }

    // Check if user is already a member
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: inviteLink.workspaceId,
          userId: session.user.id,
        },
      },
    })

    if (existingMember) {
      return NextResponse.json({ error: "You are already a member of this workspace" }, { status: 400 })
    }

    // Create membership and increment use count
    await prisma.$transaction([
      prisma.workspaceMember.create({
        data: {
          workspaceId: inviteLink.workspaceId,
          userId: session.user.id,
          role: "member",
        },
      }),
      prisma.workspaceInviteLink.update({
        where: { code },
        data: { uses: { increment: 1 } },
      }),
    ])

    return NextResponse.json({ success: true, workspace: inviteLink.workspace })
  } catch (error) {
    console.error(" Invite link acceptance error:", error)
    return NextResponse.json({ error: "Failed to accept invite" }, { status: 500 })
  }
}

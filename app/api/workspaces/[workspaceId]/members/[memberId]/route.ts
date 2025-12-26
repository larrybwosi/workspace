import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { publishToAbly, AblyChannels } from "@/lib/ably"

const updateMemberSchema = z.object({
  role: z.enum(["owner", "admin", "member", "guest"]),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ workspaceId: string; memberId: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { workspaceId, memberId } = await params

    // Check if requester is admin or owner
    const requesterMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspaceId,
          userId: session.user.id,
        },
      },
    })

    if (!requesterMember || !["owner", "admin"].includes(requesterMember.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const body = await request.json()
    const { role } = updateMemberSchema.parse(body)

    const updatedMember = await prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    })

    // Create audit log
    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId: workspaceId,
        userId: session.user.id,
        action: "member.role_changed",
        resource: "member",
        resourceId: memberId,
        metadata: { newRole: role },
      },
    })

    // Notify the member
    await publishToAbly(AblyChannels.user(updatedMember.userId), "NOTIFICATION", {
      type: "workspace.role_changed",
      workspaceId: workspaceId,
      newRole: role,
    })

    return NextResponse.json(updatedMember)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("[v0] Failed to update member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { workspaceId: string; memberId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { workspaceId, memberId } = await params
    // Check if requester is admin or owner
    const requesterMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspaceId,
          userId: session.user.id,
        },
      },
    })

    if (!requesterMember || !["owner", "admin"].includes(requesterMember.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const memberToRemove = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
    })

    if (!memberToRemove) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    // Cannot remove workspace owner
    if (memberToRemove.role === "owner") {
      return NextResponse.json({ error: "Cannot remove workspace owner" }, { status: 400 })
    }

    await prisma.workspaceMember.delete({
      where: { id: memberId },
    })

    // Create audit log
    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId: workspaceId,
        userId: session.user.id,
        action: "member.removed",
        resource: "member",
        resourceId: memberId,
      },
    })

    // Notify the removed member
    await publishToAbly(AblyChannels.user(memberToRemove.userId), "NOTIFICATION", {
      type: "workspace.removed",
      workspaceId: workspaceId,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Failed to remove member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

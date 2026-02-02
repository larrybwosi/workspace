import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { getAblyServer, AblyChannels, EVENTS } from "@/lib/integrations/ably"

const addMembersSchema = z.object({
  userIds: z.array(z.string()).min(1),
  title: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; departmentId: string }> },
) {
  try {
    const { workspaceId, departmentId } = await params
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
    })

    if (!member || !["owner", "admin"].includes(member.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { userIds, title } = addMembersSchema.parse(body)

    // Update workspace members to add department
    const updated = await prisma.workspaceMember.updateMany({
      where: {
        workspaceId,
        userId: { in: userIds },
      },
      data: {
        departmentId,
        title,
      },
    })

    // Notify via Ably
    const ably = getAblyServer()
    const channel = ably.channels.get(AblyChannels.workspace(workspaceId))
    await channel.publish(EVENTS.WORKSPACE_UPDATED, {
      type: "department_members_added",
      departmentId,
      userIds,
    })

    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId,
        userId: session.user.id,
        action: "department.members_added",
        resource: "department",
        resourceId: departmentId,
        metadata: { userIds, count: updated.count },
      },
    })

    return NextResponse.json({ success: true, count: updated.count })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Failed to add department members:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; departmentId: string }> },
) {
  try {
    const { workspaceId, departmentId } = await params
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 })
    }

    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
    })

    if (!member || !["owner", "admin"].includes(member.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId, userId } },
      data: { departmentId: null, title: null },
    })

    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId,
        userId: session.user.id,
        action: "department.member_removed",
        resource: "department",
        resourceId: departmentId,
        metadata: { removedUserId: userId },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to remove department member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

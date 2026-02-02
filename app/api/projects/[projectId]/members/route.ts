import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { notifyProjectMemberAdded, createSystemMessage } from "@/lib/notifications/notifications"

export async function POST(request: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId } = await params
    const body = await request.json()
    const { userIds } = body

    // Add members to project
    await prisma.project.update({
      where: { id: projectId },
      data: {
        members: {
          connect: userIds.map((id: string) => ({ id })),
        },
      },
    })

    // Get project details
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        channels: true,
      },
    })

    // Send notifications to each new member
    for (const userId of userIds) {
      await notifyProjectMemberAdded(projectId, userId, session.user.name)

      // Add system message to project channels
      if (project?.channels.length) {
        for (const channel of project.channels) {
          const threads = await prisma.thread.findMany({
            where: { channelId: channel.id },
            take: 1,
          })

          if (threads[0]) {
            await createSystemMessage(threads[0].id, `${session.user.name} added a new member to the project`, {
              type: "member_added",
              userId,
              projectId,
            })
          }
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(" Add project member error:", error)
    return NextResponse.json({ error: "Failed to add project members" }, { status: 500 })
  }
}

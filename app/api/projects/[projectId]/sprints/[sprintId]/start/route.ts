import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { publishToAbly } from "@/lib/ably"

export async function POST(req: NextRequest, { params }: { params: { projectId: string; sprintId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, sprintId } = await params

    // End any active sprints
    await prisma.sprint.updateMany({
      where: {
        projectId,
        status: "active",
      },
      data: {
        status: "completed",
      },
    })

    // Start the new sprint
    const sprint = await prisma.sprint.update({
      where: { id: sprintId },
      data: {
        status: "active",
      },
      include: {
        tasks: {
          include: {
            assignees: true,
          },
        },
      },
    })

    // Notify team
    await publishToAbly(`project-${projectId}`, "sprint.started", {
      sprintId: sprint.id,
      sprintName: sprint.name,
      startedBy: session.user.id,
    })

    return NextResponse.json(sprint)
  } catch (error) {
    console.error(" Error starting sprint:", error)
    return NextResponse.json({ error: "Failed to start sprint" }, { status: 500 })
  }
}

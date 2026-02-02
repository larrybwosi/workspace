import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { auth } from "@/lib/auth"
import { publishToAbly } from "@/lib/integrations/ably"

export async function POST(req: NextRequest, { params }: { params: { projectId: string; sprintId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, sprintId } = await params

    const sprint = await prisma.sprint.update({
      where: { id: sprintId },
      data: {
        status: "completed",
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
    await publishToAbly(`project-${projectId}`, "sprint.completed", {
      sprintId: sprint.id,
      sprintName: sprint.name,
      completedBy: session.user.id,
    })

    return NextResponse.json(sprint)
  } catch (error) {
    console.error(" Error ending sprint:", error)
    return NextResponse.json({ error: "Failed to end sprint" }, { status: 500 })
  }
}

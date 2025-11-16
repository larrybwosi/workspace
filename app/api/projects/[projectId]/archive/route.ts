import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createSystemMessage } from "@/lib/system-messages"

export async function POST(request: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const project = await prisma.project.update({
      where: { id: params.projectId },
      data: { status: "archived" },
      include: {
        members: true,
        channels: true,
      },
    })

    // Send notification to all project members
    for (const member of project.members) {
      await createSystemMessage.projectArchived({
        projectId: project.id,
        projectName: project.name,
        userId: member.id,
      })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error("[v0] Error archiving project:", error)
    return NextResponse.json({ error: "Failed to archive project" }, { status: 500 })
  }
}

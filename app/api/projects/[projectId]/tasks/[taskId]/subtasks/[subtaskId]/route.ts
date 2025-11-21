import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: NextRequest, { params }: { params: { taskId: string; subtaskId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, completed, assignees } = body

    const subtask = await prisma.subtask.update({
      where: { id: params.subtaskId },
      data: {
        title,
        completed,
        assignees: assignees
          ? {
              set: [],
              connect: assignees.map((id: string) => ({ id })),
            }
          : undefined,
      },
      include: {
        assignees: true,
      },
    })

    return NextResponse.json(subtask)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update subtask" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { taskId: string; subtaskId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.subtask.delete({
      where: { id: params.subtaskId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete subtask" }, { status: 500 })
  }
}

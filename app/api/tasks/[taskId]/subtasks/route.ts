import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET(request: NextRequest, { params }: { params: { taskId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const subtasks = await prisma.subtask.findMany({
      where: { taskId: params.taskId },
      include: {
        assignees: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    return NextResponse.json(subtasks)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch subtasks" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { taskId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, completed, assignees } = body

    const subtask = await prisma.subtask.create({
      data: {
        title,
        completed: completed || false,
        taskId: params.taskId,
        assignees: assignees
          ? {
              connect: assignees.map((id: string) => ({ id })),
            }
          : undefined,
      },
      include: {
        assignees: true,
      },
    })

    return NextResponse.json(subtask, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create subtask" }, { status: 500 })
  }
}

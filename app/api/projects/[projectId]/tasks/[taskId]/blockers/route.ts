import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest, { params }: { params: { taskId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { blockerId } = body

    const task = await prisma.task.update({
      where: { id: params.taskId },
      data: {
        blockers: {
          connect: { id: blockerId },
        },
      },
      include: {
        blockers: true,
      },
    })

    return NextResponse.json(task)
  } catch (error) {
    return NextResponse.json({ error: "Failed to add blocker" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { taskId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const blockerId = searchParams.get("blockerId")

    if (!blockerId) {
      return NextResponse.json({ error: "blockerId is required" }, { status: 400 })
    }

    const task = await prisma.task.update({
      where: { id: params.taskId },
      data: {
        blockers: {
          disconnect: { id: blockerId },
        },
      },
      include: {
        blockers: true,
      },
    })

    return NextResponse.json(task)
  } catch (error) {
    return NextResponse.json({ error: "Failed to remove blocker" }, { status: 500 })
  }
}

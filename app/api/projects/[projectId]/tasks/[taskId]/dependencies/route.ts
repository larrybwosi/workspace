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
    const { dependsOnId } = body

    const task = await prisma.task.update({
      where: { id: params.taskId },
      data: {
        dependencies: {
          connect: { id: dependsOnId },
        },
      },
      include: {
        dependencies: true,
      },
    })

    return NextResponse.json(task)
  } catch (error) {
    return NextResponse.json({ error: "Failed to add dependency" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { taskId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dependsOnId = searchParams.get("dependsOnId")

    if (!dependsOnId) {
      return NextResponse.json({ error: "dependsOnId is required" }, { status: 400 })
    }

    const task = await prisma.task.update({
      where: { id: params.taskId },
      data: {
        dependencies: {
          disconnect: { id: dependsOnId },
        },
      },
      include: {
        dependencies: true,
      },
    })

    return NextResponse.json(task)
  } catch (error) {
    return NextResponse.json({ error: "Failed to remove dependency" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { taskId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where: { taskId: params.taskId },
      include: {
        user: true,
      },
      orderBy: {
        startTime: "desc",
      },
    })

    return NextResponse.json(timeEntries)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch time entries" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { taskId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { startTime, endTime, duration, description } = body

    const timeEntry = await prisma.timeEntry.create({
      data: {
        taskId: params.taskId,
        userId: session.user.id,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        duration,
        description,
      },
      include: {
        user: true,
      },
    })

    return NextResponse.json(timeEntry, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create time entry" }, { status: 500 })
  }
}

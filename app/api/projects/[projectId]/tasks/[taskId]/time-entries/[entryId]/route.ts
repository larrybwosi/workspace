import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: NextRequest, { params }: { params: { taskId: string; entryId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { startTime, endTime, duration, description } = body

    const timeEntry = await prisma.timeEntry.update({
      where: { id: params.entryId },
      data: {
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        duration,
        description,
      },
      include: {
        user: true,
      },
    })

    return NextResponse.json(timeEntry)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update time entry" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { taskId: string; entryId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.timeEntry.delete({
      where: { id: params.entryId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete time entry" }, { status: 500 })
  }
}

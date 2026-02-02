import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function GET(request: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const where: any = { projectId: params.projectId }

    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        attendees: true,
        task: true,
      },
      orderBy: {
        startTime: "asc",
      },
    })

    return NextResponse.json(events)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, startTime, endTime, type, color, attendees, taskId, location, isRecurring } = body

    const event = await prisma.event.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        type,
        color,
        location,
        isRecurring: isRecurring || false,
        projectId: params.projectId,
        taskId,
        attendees: attendees
          ? {
              connect: attendees.map((id: string) => ({ id })),
            }
          : undefined,
      },
      include: {
        attendees: true,
        task: true,
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 })
  }
}

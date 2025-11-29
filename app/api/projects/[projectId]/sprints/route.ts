import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const {projectId} = await params
    const sprints = await prisma.sprint.findMany({
      where: { projectId },
      include: {
        tasks: {
          include: {
            assignees: true,
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    })

    return NextResponse.json(sprints)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch sprints" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const {projectId} = await params
    const body = await request.json()
    const { name, goal, startDate, endDate, status } = body

    const sprint = await prisma.sprint.create({
      data: {
        name,
        goal,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: status || "planning",
        projectId: projectId,
      },
      include: {
        tasks: true,
      },
    })

    return NextResponse.json(sprint, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create sprint" }, { status: 500 })
  }
}

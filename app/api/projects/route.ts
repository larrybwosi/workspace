import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const projects = await prisma.project.findMany({
      where: {
        members: {
          some: {
            id: session.user.id,
          },
        },
      },
      include: {
        creator: true,
        members: true,
        tasks: {
          include: {
            assignees: true,
          },
        },
        milestones: true,
        sprints: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(projects)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, icon, description, startDate, endDate, members, channels } = body

    const project = await prisma.project.create({
      data: {
        name,
        icon: icon || "📁",
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: "planning",
        creatorId: session.user.id,
        members: {
          connect: members?.map((id: string) => ({ id })) || [{ id: session.user.id }],
        },
        channels: channels
          ? {
              connect: channels.map((id: string) => ({ id })),
            }
          : undefined,
      },
      include: {
        creator: true,
        members: true,
        tasks: true,
      },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
  }
}

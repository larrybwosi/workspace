import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { projectId } = await params

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        creator: true,
        members: true,
        tasks: {
          include: {
            assignees: true,
            subtasks: true,
          },
        },
        milestones: true,
        sprints: {
          include: {
            tasks: true,
          },
        },
        events: true,
        // resources: {
        //   include: {
        //     member: true,
        //   },
        // },
        risks: true,
        // budgetCategories: true,
        channels: true,
      },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { projectId } = await params;

    const body = await request.json()
    const { name, icon, description, startDate, endDate, status, members, settings } = body

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        name,
        icon,
        description,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        status,
        // settings: settings ? JSON.stringify(settings) : undefined,
        members: members
          ? {
              set: [],
              connect: members.map((id: string) => ({ id })),
            }
          : undefined,
      },
      include: {
        creator: true,
        members: true,
        tasks: true,
        milestones: true,
        sprints: true,
      },
    })

    return NextResponse.json(project)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { projectId } = await params;

    await prisma.project.delete({
      where: { id: projectId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 })
  }
}

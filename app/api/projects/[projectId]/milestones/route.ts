import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const milestones = await prisma.milestone.findMany({
      where: { projectId: params.projectId },
      orderBy: {
        dueDate: "asc",
      },
    })

    return NextResponse.json(milestones)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch milestones" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, dueDate, status, progress } = body

    const milestone = await prisma.milestone.create({
      data: {
        name,
        description,
        dueDate: new Date(dueDate),
        status: status || "pending",
        progress: progress || 0,
        projectId: params.projectId,
      },
    })

    return NextResponse.json(milestone, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create milestone" }, { status: 500 })
  }
}

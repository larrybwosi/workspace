import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  templateId: z.string().optional(),
  departmentId: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  budget: z.number().optional(),
  memberIds: z.array(z.string()).optional(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { workspaceId }= await params

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const departmentId = searchParams.get("departmentId")
    const priority = searchParams.get("priority")

    // Verify workspace membership
    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: workspaceId,
        userId: session.user.id,
      },
    })

    if (!member) {
      return NextResponse.json({ error: "Not a workspace member" }, { status: 403 })
    }

    const projects = await prisma.project.findMany({
      where: {
        workspaceId: workspaceId,
        ...(status && { status }),
        ...(departmentId && { departmentId }),
        ...(priority && { priority }),
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        tasks: {
          select: {
            id: true,
            status: true,
            priority: true,
            dueDate: true,
          },
        },
        milestones: {
          select: {
            id: true,
            title: true,
            status: true,
            dueDate: true,
          },
        },
        sprints: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        resourceAllocations: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            tasks: true,
            members: true,
            statusUpdates: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Calculate additional metrics for each project
    const projectsWithMetrics = projects.map((project) => {
      const totalTasks = project.tasks.length
      const completedTasks = project.tasks.filter((t) => t.status === "done").length
      const overdueTasks = project.tasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done",
      ).length
      const highPriorityTasks = project.tasks.filter((t) => t.priority === "high" || t.priority === "critical").length

      return {
        ...project,
        metrics: {
          completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
          overdueTasks,
          highPriorityTasks,
          activeMilestones: project.milestones.filter((m) => m.status === "in_progress").length,
        },
      }
    })
    
    return NextResponse.json(projectsWithMetrics)
  } catch (error) {
    console.error("[WORKSPACE_PROJECTS_GET]", error)
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { workspaceId } = await params
    // Verify workspace membership with proper permissions
    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: workspaceId,
        userId: session.user.id,
        role: {
          in: ["owner", "admin", "member"],
        },
      },
    })

    if (!member) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createProjectSchema.parse(body)

    // If using a template, fetch template data
    let templateData = null
    if (validatedData.templateId) {
      templateData = await prisma.projectTemplate.findUnique({
        where: { id: validatedData.templateId },
      })
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || "",
        icon: validatedData.icon || "📁",
        status: validatedData.status || "planning",
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        workspaceId: workspaceId,
        creatorId: session.user.id,
        templateId: validatedData.templateId,
        members: {
          connect: [{ id: session.user.id }, ...(validatedData.memberIds?.map((id) => ({ id })) || [])],
        },
      },
      include: {
        creator: true,
        members: true,
        workspace: true,
      },
    })

    // Create audit log
    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId: workspaceId,
        userId: session.user.id,
        action: "project.created",
        resource: "project",
        // details: {
        //   projectId: project.id,
        //   projectName: project.name,
        // },
      },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error("[WORKSPACE_PROJECTS_POST]", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
  }
}

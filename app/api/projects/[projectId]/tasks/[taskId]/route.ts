import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { notifyTaskWatchers } from "@/lib/notifications/notifications"

export async function GET(request: NextRequest, { params }: { params: { taskId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const task = await prisma.task.findUnique({
      where: { id: params.taskId },
      include: {
        creator: true,
        assignees: true,
        tags: true,
        subtasks: {
          include: {
            assignees: true,
          },
        },
        timeEntries: {
          include: {
            user: true,
          },
        },
        comments: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        dependencies: true,
        blockers: true,
        watchers: true,
        attachments: true,
        sprint: true,
        project: true,
      },
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    return NextResponse.json(task)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { taskId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      startDate,
      estimatedHours,
      actualHours,
      progress,
      assignees,
      tags,
      sprintId,
      watchers,
    } = body

    const oldTask = await prisma.task.findUnique({
      where: { id: params.taskId },
      include: { watchers: true, assignees: true },
    })

    if (!oldTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const task = await prisma.task.update({
      where: { id: params.taskId },
      data: {
        title,
        description,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        estimatedHours,
        // actualHours,
        progress,
        sprintId,
        assignees: assignees
          ? {
              set: [],
              connect: assignees.map((id: string) => ({ id })),
            }
          : undefined,
        watchers: watchers
          ? {
              set: [],
              connect: watchers.map((id: string) => ({ id })),
            }
          : undefined,
        tags: tags
          ? {
              deleteMany: {},
              create: tags.map((tag: string) => ({ tag })),
            }
          : undefined,
      },
      include: {
        creator: true,
        assignees: true,
        watchers: true,
        tags: true,
        subtasks: true,
        timeEntries: true,
        comments: {
          include: {
            user: true,
          },
        },
        attachments: true,
      },
    })

    if (status && status !== oldTask.status) {
      await notifyTaskWatchers(params.taskId, "status_changed", session.user.id, {
        oldStatus: oldTask.status,
        newStatus: status,
      })
      
      if (status === "done" || status === "completed") {
        await notifyTaskWatchers(params.taskId, "completed", session.user.id)
      }
    } else if (priority && priority !== oldTask.priority) {
      await notifyTaskWatchers(params.taskId, "priority_changed", session.user.id, {
        oldPriority: oldTask.priority,
        newPriority: priority,
      })
    } else if (dueDate && dueDate !== oldTask.dueDate?.toISOString()) {
      await notifyTaskWatchers(params.taskId, "due_date_changed", session.user.id, {
        oldDueDate: oldTask.dueDate,
        newDueDate: dueDate,
      })
    } else if (assignees && JSON.stringify(assignees.sort()) !== JSON.stringify(oldTask.assignees.map(a => a.id).sort())) {
      await notifyTaskWatchers(params.taskId, "assigned", session.user.id, {
        oldAssignees: oldTask.assignees.map(a => a.name),
        newAssignees: assignees,
      })
    } else {
      await notifyTaskWatchers(params.taskId, "updated", session.user.id)
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error(" Task update error:", error)
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { taskId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.task.delete({
      where: { id: params.taskId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 })
  }
}



// import { type NextRequest, NextResponse } from "next/server"
// import { auth } from "@/lib/auth"
// import { prisma } from "@/lib/db/prisma"
// import { z } from "zod"

// const createTaskSchema = z.object({
//   title: z.string().min(1),
//   description: z.string().optional(),
//   status: z.enum(["backlog", "todo", "in-progress", "in-review", "done", "cancelled"]).default("backlog"),
//   priority: z.enum(["urgent", "high", "medium", "low", "none"]).default("medium"),
//   type: z.enum(["task", "story", "bug", "epic", "subtask"]).default("task"),
//   assignees: z.array(z.string()).optional(),
//   labels: z.array(z.string()).optional(),
//   dueDate: z.string().optional(),
//   estimate: z.number().optional(),
//   parentId: z.string().optional(),
// })

// export async function GET(request: NextRequest, { params }: { params: { projectId: string } }) {
//   try {
//     const session = await auth()
//     if (!session?.user) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//     }

//     const { projectId } = params

//     // Verify user has access to project
//     const project = await prisma.project.findFirst({
//       where: {
//         id: projectId,
//         members: {
//           some: {
//             userId: session.user.id,
//           },
//         },
//       },
//     })

//     if (!project) {
//       return NextResponse.json({ error: "Project not found" }, { status: 404 })
//     }

//     const tasks = await prisma.task.findMany({
//       where: { projectId },
//       include: {
//         assignees: {
//           include: {
//             user: {
//               select: {
//                 id: true,
//                 name: true,
//                 email: true,
//                 image: true,
//               },
//             },
//           },
//         },
//         labels: true,
//         subtasks: {
//           select: {
//             id: true,
//             title: true,
//             status: true,
//           },
//         },
//         parent: {
//           select: {
//             id: true,
//             title: true,
//           },
//         },
//         _count: {
//           select: {
//             comments: true,
//             attachments: true,
//           },
//         },
//       },
//       orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
//     })

//     return NextResponse.json(tasks)
//   } catch (error) {
//     console.error("[TASKS_GET]", error)
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 })
//   }
// }

// export async function POST(request: NextRequest, { params }: { params: { projectId: string } }) {
//   try {
//     const session = await auth()
//     if (!session?.user) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//     }

//     const { projectId } = params
//     const body = await request.json()
//     const validatedData = createTaskSchema.parse(body)

//     // Verify user has access to project
//     const project = await prisma.project.findFirst({
//       where: {
//         id: projectId,
//         members: {
//           some: {
//             userId: session.user.id,
//           },
//         },
//       },
//     })

//     if (!project) {
//       return NextResponse.json({ error: "Project not found" }, { status: 404 })
//     }

//     // Create task
//     const task = await prisma.task.create({
//       data: {
//         ...validatedData,
//         projectId,
//         createdById: session.user.id,
//         assignees: validatedData.assignees
//           ? {
//               create: validatedData.assignees.map((userId) => ({
//                 userId,
//               })),
//             }
//           : undefined,
//         labels: validatedData.labels
//           ? {
//               create: validatedData.labels.map((name) => ({
//                 name,
//                 color: "#3B82F6",
//               })),
//             }
//           : undefined,
//       },
//       include: {
//         assignees: {
//           include: {
//             user: {
//               select: {
//                 id: true,
//                 name: true,
//                 email: true,
//                 image: true,
//               },
//             },
//           },
//         },
//         labels: true,
//       },
//     })

//     // Log activity
//     await prisma.activityLog.create({
//       data: {
//         action: "task.created",
//         entityType: "task",
//         entityId: task.id,
//         userId: session.user.id,
//         metadata: {
//           taskTitle: task.title,
//           projectId,
//         },
//       },
//     })

//     return NextResponse.json(task, { status: 201 })
//   } catch (error) {
//     console.error("[TASKS_POST]", error)
//     if (error instanceof z.ZodError) {
//       return NextResponse.json({ error: "Invalid request data", details: error.errors }, { status: 400 })
//     }
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 })
//   }
// }

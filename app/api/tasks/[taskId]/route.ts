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

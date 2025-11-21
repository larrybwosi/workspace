import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/notifications"
import { publishToAbly } from "@/lib/ably"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    const where = projectId ? { projectId } : {}

    const tasks = await prisma.task.findMany({
      where,
      include: {
        creator: true,
        assignees: true,
        tags: true,
        subtasks: {
          include: {
            assignees: true,
          },
        },
        timeEntries: true,
        comments: {
          include: {
            user: true,
          },
        },
        attachments: true, // Include attachments
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(tasks)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      projectId,
      status,
      priority,
      dueDate,
      startDate,
      estimatedHours,
      assignees,
      tags,
      sprintId,
      parentTaskId,
      attachments,
      notificationSettings,
      watchers,
      customReminders,
    } = body

    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId,
        status: status || "todo",
        priority: priority || "medium",
        dueDate: dueDate ? new Date(dueDate) : null,
        startDate: startDate ? new Date(startDate) : null,
        estimatedHours,
        sprintId,
        parentTaskId,
        creatorId: session.user.id,
        assignees: assignees
          ? {
              connect: assignees.map((id: string) => ({ id })),
            }
          : undefined,
        tags: tags
          ? {
              create: tags.map((tag: string) => ({ tag })),
            }
          : undefined,
        attachments: attachments
          ? {
              create: attachments.map((file: any) => ({
                name: file.name,
                type: file.type,
                url: file.url,
                size: file.size,
              })),
            }
          : undefined,
      },
      include: {
        creator: true,
        assignees: true,
        tags: true,
        subtasks: true,
        attachments: true,
      },
    })

    if (notificationSettings?.notifyAssignees && assignees?.length > 0) {
      for (const assigneeId of assignees) {
        await createNotification({
          userId: assigneeId,
          type: "TASK_ASSIGNED",
          title: "New Task Assigned",
          message: `You have been assigned to task: ${title}`,
          entityType: "task",
          entityId: task.id,
          linkUrl: `/projects/${projectId}?task=${task.id}`,
        })

        // Send real-time notification via Ably
        await publishToAbly(`user:${assigneeId}`, "notification", {
          type: "TASK_ASSIGNED",
          taskId: task.id,
          taskTitle: title,
          priority,
        })
      }
    }

    if (watchers?.length > 0) {
      for (const watcherId of watchers) {
        await createNotification({
          userId: watcherId,
          type: "TASK_CREATED",
          title: "New Task Created",
          message: `A task you're watching has been created: ${title}`,
          entityType: "task",
          entityId: task.id,
          linkUrl: `/projects/${projectId}?task=${task.id}`,
        })
      }
    }

    if (notificationSettings?.alertOnDueDate && dueDate) {
      const alertDate = new Date(dueDate)
      alertDate.setDate(alertDate.getDate() - (notificationSettings.alertBeforeDays || 1))

      for (const assigneeId of assignees || []) {
        await prisma.scheduledNotification.create({
          data: {
            userId: assigneeId,
            title: "Task Due Soon",
            message: `Task "${title}" is due in ${notificationSettings.alertBeforeDays || 1} day(s)`,
            scheduleType: "once",
            scheduledFor: alertDate,
            entityType: "task",
            entityId: task.id,
            linkUrl: `/projects/${projectId}?task=${task.id}`,
          },
        })
      }
    }

    if (customReminders?.length > 0) {
      for (const reminder of customReminders) {
        if (reminder.time && reminder.message) {
          for (const assigneeId of assignees || []) {
            await prisma.scheduledNotification.create({
              data: {
                userId: assigneeId,
                title: `Task Reminder: ${title}`,
                message: reminder.message,
                scheduleType: "once",
                scheduledFor: new Date(reminder.time),
                entityType: "task",
                entityId: task.id,
                linkUrl: `/projects/${projectId}?task=${task.id}`,
              },
            })
          }
        }
      }
    }

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error(" Task creation error:", error)
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
  }
}

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { createSystemMessage } from "@/lib/system-messages"
import { publishMessage } from "@/lib/ably"

export const mcpTools = {
  // Task Management Tools
  getTasks: {
    description: "Get tasks from the workspace with filtering options",
    parameters: z.object({
      projectId: z.string().optional().describe("Filter tasks by project ID"),
      assigneeId: z.string().optional().describe("Filter tasks by assignee user ID"),
      status: z.enum(["todo", "in-progress", "done"]).optional().describe("Filter by task status"),
      priority: z.enum(["low", "medium", "high"]).optional().describe("Filter by priority"),
      limit: z.number().default(10).describe("Maximum number of tasks to return"),
    }),
    execute: async ({ projectId, assigneeId, status, priority, limit }: any) => {
      const tasks = await prisma.task.findMany({
        where: {
          ...(projectId && { projectId }),
          ...(status && { status }),
          ...(priority && { priority }),
          ...(assigneeId && {
            assignees: {
              some: { id: assigneeId },
            },
          }),
        },
        include: {
          project: { select: { name: true } },
          assignees: { select: { id: true, name: true, avatar: true } },
          creator: { select: { name: true } },
        },
        take: limit,
        orderBy: { createdAt: "desc" },
      })
      return tasks
    },
  },

  createTask: {
    description: "Create a new task in a project",
    parameters: z.object({
      projectId: z.string().describe("The project ID where the task will be created"),
      title: z.string().describe("Task title"),
      description: z.string().describe("Task description"),
      priority: z.enum(["low", "medium", "high"]).default("medium"),
      dueDate: z.string().optional().describe("Due date in ISO format"),
      assigneeIds: z.array(z.string()).optional().describe("Array of user IDs to assign"),
    }),
    execute: async ({ projectId, title, description, priority, dueDate, assigneeIds, userId }: any) => {
      const task = await prisma.task.create({
        data: {
          title,
          description,
          priority,
          status: "todo",
          projectId,
          creatorId: userId,
          ...(dueDate && { dueDate: new Date(dueDate) }),
          ...(assigneeIds && {
            assignees: {
              connect: assigneeIds.map((id: string) => ({ id })),
            },
          }),
        },
        include: {
          project: true,
          assignees: true,
        },
      })

      // Send notification to assignees
      if (assigneeIds) {
        const project = await prisma.project.findUnique({ where: { id: projectId } })
        for (const assigneeId of assigneeIds) {
          await createSystemMessage({
            userId: assigneeId,
            type: "task_assigned",
            title: "New Task Assigned",
            content: `You have been assigned to task "${title}" in project "${project?.name}"`,
            metadata: { taskId: task.id, projectId },
          })
        }
      }

      return task
    },
  },

  updateTask: {
    description: "Update an existing task",
    parameters: z.object({
      taskId: z.string().describe("The task ID to update"),
      title: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(["todo", "in-progress", "done"]).optional(),
      priority: z.enum(["low", "medium", "high"]).optional(),
      dueDate: z.string().optional(),
    }),
    execute: async ({ taskId, ...updates }: any) => {
      const task = await prisma.task.update({
        where: { id: taskId },
        data: {
          ...updates,
          ...(updates.dueDate && { dueDate: new Date(updates.dueDate) }),
        },
        include: {
          project: true,
          assignees: true,
        },
      })

      // Notify assignees of update
      for (const assignee of task.assignees) {
        await createSystemMessage({
          userId: assignee.id,
          type: "task_updated",
          title: "Task Updated",
          content: `Task "${task.title}" has been updated`,
          metadata: { taskId: task.id, projectId: task.projectId },
        })
      }

      return task
    },
  },

  // Project Management Tools
  getProjects: {
    description: "Get projects from the workspace",
    parameters: z.object({
      status: z.enum(["planning", "active", "on-hold", "completed"]).optional(),
      limit: z.number().default(10),
    }),
    execute: async ({ status, limit }: any) => {
      const projects = await prisma.project.findMany({
        where: {
          ...(status && { status }),
        },
        include: {
          members: { select: { id: true, name: true, avatar: true } },
          tasks: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
            },
          },
          milestones: {
            select: {
              id: true,
              title: true,
              status: true,
              progress: true,
            },
          },
        },
        take: limit,
        orderBy: { createdAt: "desc" },
      })
      return projects
    },
  },

  // Search Tools
  searchContent: {
    description: "Search across messages, tasks, notes, and projects",
    parameters: z.object({
      query: z.string().describe("Search query"),
      types: z
        .array(z.enum(["message", "task", "note", "project"]))
        .optional()
        .describe("Types of content to search"),
      limit: z.number().default(20),
    }),
    execute: async ({ query, types, limit }: any) => {
      const results: any[] = []

      // Search messages
      if (!types || types.includes("message")) {
        const messages = await prisma.message.findMany({
          where: {
            content: { contains: query, mode: "insensitive" },
          },
          include: {
            user: { select: { name: true, avatar: true } },
            thread: { select: { title: true, channelId: true } },
          },
          take: limit,
        })
        results.push(...messages.map((m) => ({ ...m, type: "message" })))
      }

      // Search tasks
      if (!types || types.includes("task")) {
        const tasks = await prisma.task.findMany({
          where: {
            OR: [{ title: { contains: query, mode: "insensitive" } }, { description: { contains: query, mode: "insensitive" } }],
          },
          include: {
            project: { select: { name: true } },
            assignees: { select: { name: true, avatar: true } },
          },
          take: limit,
        })
        results.push(...tasks.map((t) => ({ ...t, type: "task" })))
      }

      // Search notes
      if (!types || types.includes("note")) {
        const notes = await prisma.note.findMany({
          where: {
            OR: [{ title: { contains: query, mode: "insensitive" } }, { content: { contains: query, mode: "insensitive" } }],
          },
          include: {
            creator: { select: { name: true, avatar: true } },
            folder: { select: { name: true } },
            tags: true,
          },
          take: limit,
          orderBy: { lastModified: "desc" },
        })
        results.push(...notes.map((n) => ({ ...n, type: "note" })))
      }

      // Search projects
      if (!types || types.includes("project")) {
        const projects = await prisma.project.findMany({
          where: {
            OR: [{ name: { contains: query, mode: "insensitive" } }, { description: { contains: query, mode: "insensitive" } }],
          },
          include: {
            members: { select: { name: true, avatar: true } },
          },
          take: limit,
        })
        results.push(...projects.map((p) => ({ ...p, type: "project" })))
      }

      return results
    },
  },

  // Note Tools
  getNotes: {
    description: "Get notes from the workspace",
    parameters: z.object({
      folderId: z.string().optional(),
      tags: z.array(z.string()).optional(),
      limit: z.number().default(10),
    }),
    execute: async ({ folderId, tags, limit }: any) => {
      const notes = await prisma.note.findMany({
        where: {
          ...(folderId && { folderId }),
          ...(tags && {
            tags: {
              some: {
                tag: { in: tags },
              },
            },
          }),
        },
        include: {
          creator: { select: { name: true, avatar: true } },
          folder: { select: { name: true } },
          tags: true,
        },
        take: limit,
        orderBy: { lastModified: "desc" },
      })
      return notes
    },
  },

  createNote: {
    description: "Create a new note",
    parameters: z.object({
      title: z.string(),
      content: z.string(),
      folderId: z.string(),
      tags: z.array(z.string()).optional(),
    }),
    execute: async ({ title, content, folderId, tags, userId }: any) => {
      const note = await prisma.note.create({
        data: {
          title,
          content,
          folderId,
          creatorId: userId,
          ...(tags && {
            tags: {
              create: tags.map((tag: string) => ({ tag })),
            },
          }),
        },
        include: {
          folder: true,
          tags: true,
        },
      })
      return note
    },
  },

  // Analytics Tools
  getProjectAnalytics: {
    description: "Get analytics and insights for a project",
    parameters: z.object({
      projectId: z.string(),
    }),
    execute: async ({ projectId }: any) => {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          tasks: true,
          milestones: true,
          sprints: true,
        },
      })

      if (!project) return null

      const totalTasks = project.tasks.length
      const completedTasks = project.tasks.filter((t) => t.status === "done").length
      const inProgressTasks = project.tasks.filter((t) => t.status === "in-progress").length
      const overdueTasks = project.tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done").length

      const analytics = {
        project: {
          id: project.id,
          name: project.name,
          status: project.status,
        },
        taskMetrics: {
          total: totalTasks,
          completed: completedTasks,
          inProgress: inProgressTasks,
          overdue: overdueTasks,
          completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        },
        milestones: project.milestones.map((m) => ({
          title: m.title,
          status: m.status,
          progress: m.progress,
        })),
        sprints: project.sprints.map((s) => ({
          name: s.name,
          status: s.status,
          velocity: s.velocity,
        })),
      }

      return analytics
    },
  },

  // Notification Tool
  sendNotification: {
    description: "Send a notification to users",
    parameters: z.object({
      userIds: z.array(z.string()),
      title: z.string(),
      message: z.string(),
      type: z.string().optional(),
      linkUrl: z.string().optional(),
    }),
    execute: async ({ userIds, title, message, type, linkUrl }: any) => {
      const notifications = await Promise.all(
        userIds.map((userId: string) =>
          prisma.notification.create({
            data: {
              userId,
              title,
              message,
              type: type || "info",
              linkUrl,
            },
          })
        )
      )
      return notifications
    },
  },

  // Scheduled Notification Tools
  createScheduledNotification: {
    description: "Create a scheduled notification that will be sent at a specific time",
    parameters: z.object({
      title: z.string().describe("Notification title"),
      message: z.string().describe("Notification message"),
      scheduledFor: z.string().describe("When to send the notification (ISO format)"),
      scheduleType: z.enum(["once", "daily", "weekly", "monthly"]).default("once"),
      entityType: z.string().optional().describe("Related entity type (task, project, etc)"),
      entityId: z.string().optional().describe("Related entity ID"),
      linkUrl: z.string().optional().describe("URL to navigate when clicked"),
      recurrence: z
        .object({
          frequency: z.number().optional(),
          daysOfWeek: z.array(z.number()).optional(),
          daysOfMonth: z.array(z.number()).optional(),
          endDate: z.string().optional(),
        })
        .optional(),
    }),
    execute: async ({ userId, ...params }: any) => {
      const { createScheduledNotification } = await import("@/lib/scheduled-notifications")
      
      const notification = await createScheduledNotification({
        userId,
        ...params,
        scheduledFor: new Date(params.scheduledFor),
        recurrence: params.recurrence ? {
          ...params.recurrence,
          endDate: params.recurrence.endDate ? new Date(params.recurrence.endDate) : undefined,
        } : undefined,
      })

      return {
        id: notification.id,
        message: `Scheduled notification created for ${new Date(params.scheduledFor).toLocaleString()}`,
        notification,
      }
    },
  },

  getScheduledNotifications: {
    description: "Get user's scheduled notifications",
    parameters: z.object({
      includeHistory: z.boolean().default(false),
    }),
    execute: async ({ userId, includeHistory }: any) => {
      const { getUserScheduledNotifications } = await import("@/lib/scheduled-notifications")
      return await getUserScheduledNotifications(userId)
    },
  },

  updateScheduledNotification: {
    description: "Update a scheduled notification",
    parameters: z.object({
      notificationId: z.string(),
      title: z.string().optional(),
      message: z.string().optional(),
      scheduledFor: z.string().optional(),
      isActive: z.boolean().optional(),
    }),
    execute: async ({ notificationId, ...updates }: any) => {
      const { updateScheduledNotification } = await import("@/lib/scheduled-notifications")
      
      return await updateScheduledNotification(notificationId, {
        ...updates,
        scheduledFor: updates.scheduledFor ? new Date(updates.scheduledFor) : undefined,
      })
    },
  },

  deleteScheduledNotification: {
    description: "Delete a scheduled notification",
    parameters: z.object({
      notificationId: z.string(),
    }),
    execute: async ({ notificationId }: any) => {
      const { deleteScheduledNotification } = await import("@/lib/scheduled-notifications")
      await deleteScheduledNotification(notificationId)
      return { message: "Scheduled notification deleted successfully" }
    },
  },
}

export type MCPTool = keyof typeof mcpTools

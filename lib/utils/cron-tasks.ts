import { prisma } from "@/lib/db/prisma"
import { taskAlertMessages } from "@/lib/system-messages"

/**
 * Cron job for checking tasks due soon (24-48 hours)
 */
export async function checkTasksDueSoon() {
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const twoDaysFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000)

  const tasks = await prisma.task.findMany({
    where: {
      dueDate: {
        gte: tomorrow,
        lte: twoDaysFromNow,
      },
      status: {
        not: "done",
      },
    },
    include: {
      project: true,
      assignees: true,
    },
  })

  for (const task of tasks) {
    const daysUntilDue = Math.ceil((task.dueDate!.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))

    // Notify assignees
    for (const assignee of task.assignees) {
      await prisma.notification.create({
        data: {
          userId: assignee.id,
          type: "task_due_soon",
          title: "Task Due Soon",
          message: `${task.title} is due in ${daysUntilDue} days`,
          entityType: "task",
          entityId: task.id,
          linkUrl: `/projects/${task.projectId}?taskId=${task.id}`,
        },
      })
    }

    // Create system message in project channel
    if (task.project.channels.length > 0) {
      // Get the first channel for the project
      const channel = await prisma.channel.findFirst({
        where: { id: { in: task.project.channels as string[] } },
        include: { threads: true },
      })

      if (channel?.threads.length) {
        await taskAlertMessages.taskDueSoon(channel.threads[0].id, task.title, daysUntilDue, task.id, task.projectId)
      }
    }
  }

  console.log(`[Cron] Checked ${tasks.length} tasks due soon`)
}

/**
 * Cron job for checking overdue tasks
 */
export async function checkOverdueTasks() {
  const now = new Date()

  const overdueTasks = await prisma.task.findMany({
    where: {
      dueDate: {
        lt: now,
      },
      status: {
        not: "done",
      },
    },
    include: {
      project: true,
      assignees: true,
    },
  })

  for (const task of overdueTasks) {
    const daysOverdue = Math.ceil((now.getTime() - task.dueDate!.getTime()) / (24 * 60 * 60 * 1000))

    // Notify assignees
    for (const assignee of task.assignees) {
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: assignee.id,
          type: "task_overdue",
          entityId: task.id,
        },
      })

      if (!existingNotification) {
        await prisma.notification.create({
          data: {
            userId: assignee.id,
            type: "task_overdue",
            title: "Task Overdue",
            message: `${task.title} is ${daysOverdue} days overdue`,
            entityType: "task",
            entityId: task.id,
            linkUrl: `/projects/${task.projectId}?taskId=${task.id}`,
          },
        })
      }
    }

    // Create system message
    if (task.project.channels.length > 0) {
      const channel = await prisma.channel.findFirst({
        where: { id: { in: task.project.channels as string[] } },
        include: { threads: true },
      })

      if (channel?.threads.length) {
        await taskAlertMessages.taskOverdue(channel.threads[0].id, task.title, daysOverdue, task.id, task.projectId)
      }
    }
  }

  console.log(`[Cron] Checked ${overdueTasks.length} overdue tasks`)
}

/**
 * Cron job for checking project deadlines
 */
export async function checkProjectDeadlines() {
  const now = new Date()
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const projects = await prisma.project.findMany({
    where: {
      endDate: {
        gte: now,
        lte: sevenDaysFromNow,
      },
      status: {
        not: "completed",
      },
    },
    include: {
      members: true,
      channels: true,
    },
  })

  for (const project of projects) {
    const daysUntilDeadline = Math.ceil((project.endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))

    // Notify project members
    for (const member of project.members) {
      await prisma.notification.create({
        data: {
          userId: member.id,
          type: "project_deadline_approaching",
          title: "Project Deadline Approaching",
          message: `Project ${project.name} deadline in ${daysUntilDeadline} days`,
          entityType: "project",
          entityId: project.id,
          linkUrl: `/projects/${project.id}`,
        },
      })
    }

    // Create system message
    if (project.channels && project.channels.length > 0) {
      const channel = await prisma.channel.findFirst({
        where: { id: { in: project.channels as string[] } },
        include: { threads: true },
      })

      if (channel?.threads.length) {
        await taskAlertMessages.projectDeadlineApproaching(
          channel.threads[0].id,
          project.name,
          daysUntilDeadline,
          project.id,
        )
      }
    }
  }

  console.log(`[Cron] Checked ${projects.length} project deadlines`)
}

/**
 * Cron job for checking sprint status
 */
export async function checkSprintStatus() {
  const now = new Date()
  const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const endingSprints = await prisma.sprint.findMany({
    where: {
      endDate: {
        gte: now,
        lte: twentyFourHoursFromNow,
      },
      status: "active",
    },
    include: {
      project: true,
      members: true,
      tasks: true,
    },
  })

  for (const sprint of endingSprints) {
    const hoursRemaining = Math.ceil((sprint.endDate.getTime() - now.getTime()) / (60 * 60 * 1000))

    // Notify sprint members
    for (const member of sprint.members) {
      await prisma.notification.create({
        data: {
          userId: member.id,
          type: "sprint_ending",
          title: "Sprint Ending Soon",
          message: `Sprint "${sprint.name}" ending in ${hoursRemaining} hours`,
          entityType: "sprint",
          entityId: sprint.id,
          linkUrl: `/projects/${sprint.projectId}`,
        },
      })
    }
  }

  console.log(`[Cron] Checked ${endingSprints.length} ending sprints`)
}

/**
 * Cron job for milestone completion tracking
 */
export async function checkMilestoneCompletion() {
  const milestones = await prisma.milestone.findMany({
    where: {
      status: { not: "completed" },
    },
    include: {
      project: true,
      tasks: true,
    },
  })

  for (const milestone of milestones) {
    const totalTasks = milestone.tasks.length
    const completedTasks = milestone.tasks.filter((t) => t.status === "done").length
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    // Update milestone progress
    if (progress >= 100) {
      await prisma.milestone.update({
        where: { id: milestone.id },
        data: { status: "completed", progress: 100 },
      })

      // Create system message
      if (milestone.project.channels && milestone.project.channels.length > 0) {
        const channel = await prisma.channel.findFirst({
          where: { id: { in: milestone.project.channels as string[] } },
          include: { threads: true },
        })

        if (channel?.threads.length) {
          await taskAlertMessages.milestoneCompletion(
            channel.threads[0].id,
            milestone.title,
            milestone.project.name,
            milestone.projectId,
          )
        }
      }

      // Notify project members
      for (const member of milestone.project.members) {
        await prisma.notification.create({
          data: {
            userId: member.id,
            type: "milestone_completed",
            title: "Milestone Completed",
            message: `Milestone "${milestone.title}" has been completed`,
            entityType: "milestone",
            entityId: milestone.id,
            linkUrl: `/projects/${milestone.projectId}`,
          },
        })
      }
    } else {
      await prisma.milestone.update({
        where: { id: milestone.id },
        data: { progress },
      })
    }
  }

  console.log(`[Cron] Checked ${milestones.length} milestones`)
}

/**
 * Cron job for processing scheduled notifications
 */
export async function processScheduledNotifications() {
  const { processScheduledNotifications: process } = await import("@/lib/notifications/scheduled-notifications")
  await process()
}

/**
 * Main cron handler to run all tasks
 */
export async function runAllCronTasks() {
  try {
    console.log("[Cron] Starting cron job execution")

    await checkTasksDueSoon()
    await checkOverdueTasks()
    await checkProjectDeadlines()
    await checkSprintStatus()
    await checkMilestoneCompletion()
    await processScheduledNotifications() // Add scheduled notifications

    console.log("[Cron] Completed all cron tasks")
  } catch (error) {
    console.error("[Cron] Error running cron tasks:", error)
  }
}

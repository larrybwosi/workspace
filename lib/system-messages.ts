import { prisma } from "@/lib/prisma"
import { getAblyRest, AblyChannels, AblyEvents } from "@/lib/ably"

/**
 * System message utilities for easy composition of standard messages
 */

interface SystemMessageOptions {
  threadId: string
  metadata?: Record<string, any>
  broadcast?: boolean
}

/**
 * Create a formatted system message
 */
export async function createSystemMessage(content: string, options: SystemMessageOptions) {
  const message = await prisma.message.create({
    data: {
      threadId: options.threadId,
      userId: "system",
      content,
      messageType: "system",
      metadata: options.metadata,
    },
    include: {
      user: true,
    },
  })

  if (options.broadcast !== false) {
    const ably = getAblyRest()
    const channel = ably.channels.get(AblyChannels.thread(options.threadId))
    await channel.publish(AblyEvents.MESSAGE_SENT, message)
  }

  return message
}

/**
 * User joined/left messages
 */
export const userMessages = {
  joined: async (threadId: string, userName: string, userId: string) => {
    return createSystemMessage(`**${userName}** joined the conversation`, {
      threadId,
      metadata: {
        type: "user_joined",
        userId,
        userName,
      },
    })
  },

  left: async (threadId: string, userName: string, userId: string) => {
    return createSystemMessage(`**${userName}** left the conversation`, {
      threadId,
      metadata: {
        type: "user_left",
        userId,
        userName,
      },
    })
  },

  invited: async (threadId: string, inviterName: string, inviteeName: string) => {
    return createSystemMessage(`**${inviterName}** invited **${inviteeName}** to the conversation`, {
      threadId,
      metadata: {
        type: "user_invited",
        inviterName,
        inviteeName,
      },
    })
  },
}

/**
 * Project-related system messages
 */
export const projectMessages = {
  created: async (threadId: string, projectName: string, creatorName: string, projectId: string) => {
    return createSystemMessage(`🎉 **${creatorName}** created project [${projectName}](/projects/${projectId})`, {
      threadId,
      metadata: {
        type: "project_created",
        projectId,
        projectName,
        creatorName,
      },
    })
  },

  memberAdded: async (threadId: string, projectName: string, userName: string, projectId: string) => {
    return createSystemMessage(`**${userName}** was added to [${projectName}](/projects/${projectId})`, {
      threadId,
      metadata: {
        type: "project_member_added",
        projectId,
        projectName,
        userName,
      },
    })
  },

  statusChanged: async (
    threadId: string,
    projectName: string,
    oldStatus: string,
    newStatus: string,
    projectId: string,
  ) => {
    return createSystemMessage(
      `Project [${projectName}](/projects/${projectId}) status changed from **${oldStatus}** to **${newStatus}**`,
      {
        threadId,
        metadata: {
          type: "project_status_changed",
          projectId,
          projectName,
          oldStatus,
          newStatus,
        },
      },
    )
  },

  milestoneCompleted: async (threadId: string, milestoneName: string, projectName: string, projectId: string) => {
    return createSystemMessage(
      `✅ Milestone **${milestoneName}** completed in [${projectName}](/projects/${projectId})`,
      {
        threadId,
        metadata: {
          type: "milestone_completed",
          projectId,
          projectName,
          milestoneName,
        },
      },
    )
  },
}

/**
 * Task-related system messages
 */
export const taskMessages = {
  created: async (threadId: string, taskTitle: string, creatorName: string, taskId: string, projectId: string) => {
    return createSystemMessage(
      `📋 **${creatorName}** created task [${taskTitle}](/projects/${projectId}?taskId=${taskId})`,
      {
        threadId,
        metadata: {
          type: "task_created",
          taskId,
          taskTitle,
          creatorName,
          projectId,
        },
      },
    )
  },

  assigned: async (threadId: string, taskTitle: string, assigneeName: string, taskId: string, projectId: string) => {
    return createSystemMessage(
      `**${assigneeName}** was assigned to [${taskTitle}](/projects/${projectId}?taskId=${taskId})`,
      {
        threadId,
        metadata: {
          type: "task_assigned",
          taskId,
          taskTitle,
          assigneeName,
          projectId,
        },
      },
    )
  },

  completed: async (threadId: string, taskTitle: string, completedBy: string, taskId: string, projectId: string) => {
    return createSystemMessage(
      `✅ **${completedBy}** completed [${taskTitle}](/projects/${projectId}?taskId=${taskId})`,
      {
        threadId,
        metadata: {
          type: "task_completed",
          taskId,
          taskTitle,
          completedBy,
          projectId,
        },
      },
    )
  },

  statusChanged: async (
    threadId: string,
    taskTitle: string,
    oldStatus: string,
    newStatus: string,
    taskId: string,
    projectId: string,
  ) => {
    return createSystemMessage(
      `Task [${taskTitle}](/projects/${projectId}?taskId=${taskId}) moved from **${oldStatus}** to **${newStatus}**`,
      {
        threadId,
        metadata: {
          type: "task_status_changed",
          taskId,
          taskTitle,
          oldStatus,
          newStatus,
          projectId,
        },
      },
    )
  },
}

/**
 * Note-related system messages
 */
export const noteMessages = {
  shared: async (threadId: string, noteTitle: string, sharedBy: string, sharedWith: string, noteId: string) => {
    return createSystemMessage(
      `📝 **${sharedBy}** shared note [${noteTitle}](/notes?noteId=${noteId}) with **${sharedWith}**`,
      {
        threadId,
        metadata: {
          type: "note_shared",
          noteId,
          noteTitle,
          sharedBy,
          sharedWith,
        },
      },
    )
  },

  linkedToProject: async (
    threadId: string,
    noteTitle: string,
    projectName: string,
    noteId: string,
    projectId: string,
  ) => {
    return createSystemMessage(
      `📌 Note [${noteTitle}](/notes?noteId=${noteId}) linked to [${projectName}](/projects/${projectId})`,
      {
        threadId,
        metadata: {
          type: "note_linked_to_project",
          noteId,
          noteTitle,
          projectId,
          projectName,
        },
      },
    )
  },
}

/**
 * Integration system messages
 */
export const integrationMessages = {
  erpUpdate: async (threadId: string, message: string, data?: any) => {
    return createSystemMessage(`🔄 **ERP Update:** ${message}`, {
      threadId,
      metadata: {
        type: "erp_update",
        source: "erp",
        data,
      },
    })
  },

  externalSystem: async (threadId: string, systemName: string, message: string, data?: any) => {
    return createSystemMessage(`🔗 **${systemName}:** ${message}`, {
      threadId,
      metadata: {
        type: "external_system",
        source: systemName,
        data,
      },
    })
  },

  webhookReceived: async (threadId: string, webhookName: string, message: string, data?: any) => {
    return createSystemMessage(`📨 **${webhookName}:** ${message}`, {
      threadId,
      metadata: {
        type: "webhook",
        source: webhookName,
        data,
      },
    })
  },
}

/**
 * Custom integration message
 */
export async function createIntegrationMessage(
  threadId: string,
  config: {
    title: string
    message: string
    icon?: string
    linkUrl?: string
    linkText?: string
    source?: string
    data?: any
  },
) {
  const formattedMessage = `${config.icon || "🔗"} **${config.title}**\n${config.message}${
    config.linkUrl ? `\n[${config.linkText || "View Details"}](${config.linkUrl})` : ""
  }`

  return createSystemMessage(formattedMessage, {
    threadId,
    metadata: {
      type: "custom_integration",
      source: config.source || "external",
      data: config.data,
    },
  })
}

/**
 * Task alert messages for cron notifications
 */
export const taskAlertMessages = {
  taskDueSoon: async (threadId: string, taskTitle: string, daysUntilDue: number, taskId: string, projectId: string) => {
    return createSystemMessage(
      `⏰ **Task due in ${daysUntilDue} days:** [${taskTitle}](/projects/${projectId}?taskId=${taskId})`,
      {
        threadId,
        metadata: {
          type: "task_due_soon",
          taskId,
          taskTitle,
          projectId,
          daysUntilDue,
        },
      },
    )
  },

  taskOverdue: async (threadId: string, taskTitle: string, daysOverdue: number, taskId: string, projectId: string) => {
    return createSystemMessage(
      `🚨 **Task overdue by ${daysOverdue} days:** [${taskTitle}](/projects/${projectId}?taskId=${taskId})`,
      {
        threadId,
        metadata: {
          type: "task_overdue",
          taskId,
          taskTitle,
          projectId,
          daysOverdue,
        },
      },
    )
  },

  taskCompleted: async (
    threadId: string,
    taskTitle: string,
    completedBy: string,
    taskId: string,
    projectId: string,
  ) => {
    return createSystemMessage(
      `✅ **${completedBy}** completed [${taskTitle}](/projects/${projectId}?taskId=${taskId})`,
      {
        threadId,
        metadata: {
          type: "task_completed_alert",
          taskId,
          taskTitle,
          completedBy,
          projectId,
        },
      },
    )
  },

  projectDeadlineApproaching: async (
    threadId: string,
    projectName: string,
    daysUntilDeadline: number,
    projectId: string,
  ) => {
    return createSystemMessage(
      `📅 **Project deadline approaching in ${daysUntilDeadline} days:** [${projectName}](/projects/${projectId})`,
      {
        threadId,
        metadata: {
          type: "project_deadline_approaching",
          projectId,
          projectName,
          daysUntilDeadline,
        },
      },
    )
  },

  sprintEnding: async (threadId: string, sprintName: string, hoursRemaining: number, projectId: string) => {
    return createSystemMessage(`⏱️ **Sprint "${sprintName}" ending in ${hoursRemaining} hours**`, {
      threadId,
      metadata: {
        type: "sprint_ending",
        projectId,
        sprintName,
        hoursRemaining,
      },
    })
  },

  milestoneCompletion: async (threadId: string, milestoneName: string, projectName: string, projectId: string) => {
    return createSystemMessage(
      `🎉 **Milestone "${milestoneName}" achieved in [${projectName}](/projects/${projectId})**`,
      {
        threadId,
        metadata: {
          type: "milestone_completion_alert",
          projectId,
          projectName,
          milestoneName,
        },
      },
    )
  },

  dailyTaskSummary: async (
    threadId: string,
    summary: { total: number; completed: number; pending: number; overdue: number },
    projectId: string,
  ) => {
    return createSystemMessage(
      `📊 **Daily Task Summary for [Project](/projects/${projectId}):**\n- Total: ${summary.total}\n- Completed: ${summary.completed}\n- Pending: ${summary.pending}\n- Overdue: ${summary.overdue}`,
      {
        threadId,
        metadata: {
          type: "daily_task_summary",
          projectId,
          summary,
        },
      },
    )
  },
}

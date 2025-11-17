import { prisma } from "@/lib/prisma"
import { getAblyRest, AblyChannels, AblyEvents } from "@/lib/ably"
import { sendPushNotification } from "@/lib/push-notifications"

export interface NotificationPayload {
  userId: string
  type: "project_invitation" | "note_shared" | "task_assigned" | "mention" | "system"
  title: string
  message: string
  entityType?: "project" | "note" | "task" | "channel"
  entityId?: string
  linkUrl?: string
  metadata?: Record<string, any>
}

export async function createNotification(payload: NotificationPayload) {
  // Create notification in database
  const notification = await prisma.notification.create({
    data: {
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      entityType: payload.entityType,
      entityId: payload.entityId,
      linkUrl: payload.linkUrl,
      metadata: payload.metadata,
    },
  })

  // Send real-time notification via Ably
  const ably = getAblyRest()
  const channel = ably.channels.get(AblyChannels.notifications(payload.userId))

  await channel.publish(AblyEvents.NOTIFICATION, {
    id: notification.id,
    ...payload,
    createdAt: notification.createdAt,
  })

  try {
    await sendPushNotification({
      userId: payload.userId,
      title: payload.title,
      body: payload.message,
      data: {
        type: payload.type,
        entityType: payload.entityType || "",
        entityId: payload.entityId || "",
      },
      linkUrl: payload.linkUrl,
      notificationId: notification.id,
    })
  } catch (error) {
    console.error(" Push notification error:", error)
    // Don't fail the whole operation if push notifications fail
  }

  return notification
}

export async function createSystemMessage(threadId: string, content: string, metadata?: Record<string, any>) {
  // Create system message in database
  const message = await prisma.message.create({
    data: {
      threadId,
      userId: "system",
      content,
      messageType: "system",
      metadata,
    },
    include: {
      user: true,
    },
  })

  // Broadcast via Ably
  const ably = getAblyRest()
  const channel = ably.channels.get(AblyChannels.thread(threadId))

  await channel.publish(AblyEvents.MESSAGE_SENT, message)

  return message
}

export async function notifyProjectMemberAdded(projectId: string, userId: string, addedBy: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { creator: true },
  })

  if (!project) return

  await createNotification({
    userId,
    type: "project_invitation",
    title: "Added to Project",
    message: `You've been added to ${project.name}`,
    entityType: "project",
    entityId: projectId,
    linkUrl: `/projects/${projectId}`,
    metadata: {
      projectName: project.name,
      addedBy,
    },
  })
}

export async function notifyNoteShared(noteId: string, userId: string, sharedBy: string) {
  const note = await prisma.note.findUnique({
    where: { id: noteId },
  })

  if (!note) return

  await createNotification({
    userId,
    type: "note_shared",
    title: "Note Shared With You",
    message: `${sharedBy} shared "${note.title}" with you`,
    entityType: "note",
    entityId: noteId,
    linkUrl: `/notes?noteId=${noteId}`,
    metadata: {
      noteTitle: note.title,
      sharedBy,
    },
  })
}

export async function notifyTaskAssigned(taskId: string, userId: string, assignedBy: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: true },
  })

  if (!task) return

  await createNotification({
    userId,
    type: "task_assigned",
    title: "New Task Assigned",
    message: `You've been assigned to "${task.title}"`,
    entityType: "task",
    entityId: taskId,
    linkUrl: `/projects/${task.projectId}?taskId=${taskId}`,
    metadata: {
      taskTitle: task.title,
      projectName: task.project.name,
      assignedBy,
    },
  })
}

export async function notifyMention(
  messageId: string,
  mentionedUserId: string,
  mentionedBy: string,
  channelId: string,
  messageContent: string
) {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
  })

  await createNotification({
    userId: mentionedUserId,
    type: "mention",
    title: "You were mentioned",
    message: `${mentionedBy} mentioned you in #${channel?.name || "a channel"}`,
    entityType: "channel",
    entityId: channelId,
    linkUrl: `/channels/${channelId}?messageId=${messageId}`,
    metadata: {
      messageContent: messageContent.slice(0, 100),
      mentionedBy,
      channelName: channel?.name,
      messageId,
    },
  })
}

export async function notifyTaskWatchers(
  taskId: string,
  eventType: "updated" | "status_changed" | "commented" | "assigned" | "priority_changed" | "due_date_changed" | "completed",
  changedBy: string,
  changes?: Record<string, any>
) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      watchers: true,
      project: true,
      assignees: true,
    },
  })

  if (!task) return

  // Get the user who made the change
  const changedByUser = await prisma.user.findUnique({
    where: { id: changedBy },
  })

  if (!changedByUser) return

  // Notify all watchers except the person who made the change
  const watchersToNotify = task.watchers.filter(watcher => watcher.id !== changedBy)

  const notificationMap = {
    updated: {
      title: "Task Updated",
      message: `${changedByUser.name} updated "${task.title}"`,
    },
    status_changed: {
      title: "Task Status Changed",
      message: `${changedByUser.name} changed status of "${task.title}" to ${changes?.newStatus}`,
    },
    commented: {
      title: "New Comment on Task",
      message: `${changedByUser.name} commented on "${task.title}"`,
    },
    assigned: {
      title: "Task Assignee Changed",
      message: `${changedByUser.name} modified assignees on "${task.title}"`,
    },
    priority_changed: {
      title: "Task Priority Changed",
      message: `${changedByUser.name} changed priority of "${task.title}" to ${changes?.newPriority}`,
    },
    due_date_changed: {
      title: "Task Due Date Changed",
      message: `${changedByUser.name} changed due date of "${task.title}"`,
    },
    completed: {
      title: "Task Completed",
      message: `${changedByUser.name} marked "${task.title}" as completed`,
    },
  }

  const notificationInfo = notificationMap[eventType]

  // Create notifications for all watchers
  await Promise.all(
    watchersToNotify.map(watcher =>
      createNotification({
        userId: watcher.id,
        type: "task_assigned",
        title: notificationInfo.title,
        message: notificationInfo.message,
        entityType: "task",
        entityId: taskId,
        linkUrl: `/projects/${task.projectId}?taskId=${taskId}`,
        metadata: {
          taskTitle: task.title,
          projectName: task.project.name,
          eventType,
          changedBy: changedByUser.name,
          changes,
        },
      })
    )
  )

  // Also send system message to project channel if configured
  if (task.project && eventType === "completed") {
    // Find project channel and send completion message
    const projectChannels = await prisma.channel.findMany({
      where: {
        projects: {
          some: { id: task.projectId },
        },
      },
      take: 1,
    })

    if (projectChannels.length > 0) {
      await createSystemMessage(
        projectChannels[0].id,
        `Task "${task.title}" has been completed by ${changedByUser.name}`,
        {
          taskId: task.id,
          taskTitle: task.title,
          completedBy: changedByUser.name,
        }
      )
    }
  }
}

export async function addTaskWatcher(taskId: string, userId: string) {
  await prisma.task.update({
    where: { id: taskId },
    data: {
      watchers: {
        connect: { id: userId },
      },
    },
  })
}

export async function removeTaskWatcher(taskId: string, userId: string) {
  await prisma.task.update({
    where: { id: taskId },
    data: {
      watchers: {
        disconnect: { id: userId },
      },
    },
  })
}

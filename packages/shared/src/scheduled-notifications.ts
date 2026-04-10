import { prisma } from '@repo/database';
import { createNotification } from './notifications';

export interface ScheduledNotificationConfig {
  userId: string;
  title: string;
  message: string;
  scheduleType: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
  scheduledFor: Date;
  timezone?: string;
  recurrence?: {
    frequency?: number; // e.g., every 2 days
    daysOfWeek?: number[]; // 0-6 for Sunday-Saturday
    daysOfMonth?: number[]; // 1-31
    endDate?: Date;
  };
  entityType?: 'channel';
  entityId?: string;
  linkUrl?: string;
  metadata?: Record<string, any>;
}

export async function createScheduledNotification(config: ScheduledNotificationConfig) {
  const scheduledNotification = await prisma.scheduledNotification.create({
    data: {
      userId: config.userId,
      title: config.title,
      message: config.message,
      scheduleType: config.scheduleType,
      scheduledFor: config.scheduledFor,
      timezone: config.timezone || 'UTC',
      recurrence: (config.recurrence as any) || null,
      entityType: config.entityType,
      entityId: config.entityId,
      linkUrl: config.linkUrl,
      metadata: config.metadata || {},
    },
  });

  return scheduledNotification;
}

export async function updateScheduledNotification(id: string, updates: Partial<ScheduledNotificationConfig>) {
  return await prisma.scheduledNotification.update({
    where: { id },
    data: {
      ...(updates as any),
      updatedAt: new Date(),
    },
  });
}

export async function deleteScheduledNotification(id: string) {
  return await prisma.scheduledNotification.delete({
    where: { id },
  });
}

export async function pauseScheduledNotification(id: string) {
  return await prisma.scheduledNotification.update({
    where: { id },
    data: { isActive: false },
  });
}

export async function resumeScheduledNotification(id: string) {
  return await prisma.scheduledNotification.update({
    where: { id },
    data: { isActive: true },
  });
}

export async function getUserScheduledNotifications(userId: string) {
  return await prisma.scheduledNotification.findMany({
    where: { userId },
    orderBy: { scheduledFor: 'asc' },
    include: {
      history: {
        orderBy: { sentAt: 'desc' },
        take: 5,
      },
    },
  });
}

/**
 * Process and send scheduled notifications that are due
 */
export async function processScheduledNotifications() {
  const now = new Date();

  const dueNotifications = await prisma.scheduledNotification.findMany({
    where: {
      isActive: true,
      isSent: false,
      scheduledFor: {
        lte: now,
      },
    },
    include: {
      user: true,
    },
  });

  console.log(`[Scheduled Notifications] Processing ${dueNotifications.length} due notifications`);

  for (const notification of dueNotifications) {
    try {
      // Send the notification
      await createNotification({
        userId: notification.userId,
        type: 'system',
        title: notification.title,
        message: notification.message,
        entityType: notification.entityType as any,
        entityId: notification.entityId || undefined,
        linkUrl: notification.linkUrl || undefined,
        metadata: notification.metadata as Record<string, any>,
      });

      // Log success
      await prisma.scheduledNotificationHistory.create({
        data: {
          scheduledNotificationId: notification.id,
          sentAt: new Date(),
          success: true,
        },
      });

      // Handle recurrence
      if (notification.scheduleType !== 'once' && notification.recurrence) {
        const nextSchedule = calculateNextSchedule(notification);

        if (nextSchedule) {
          await prisma.scheduledNotification.update({
            where: { id: notification.id },
            data: {
              scheduledFor: nextSchedule,
              isSent: false,
            },
          });
        } else {
          // No more recurrences, mark as sent
          await prisma.scheduledNotification.update({
            where: { id: notification.id },
            data: { isSent: true, sentAt: new Date() },
          });
        }
      } else {
        // One-time notification, mark as sent
        await prisma.scheduledNotification.update({
          where: { id: notification.id },
          data: { isSent: true, sentAt: new Date() },
        });
      }

      console.log(`[Scheduled Notifications] Sent notification ${notification.id} to user ${notification.userId}`);
    } catch (error: any) {
      console.error(`[Scheduled Notifications] Error sending notification ${notification.id}:`, error);

      // Log failure
      await prisma.scheduledNotificationHistory.create({
        data: {
          scheduledNotificationId: notification.id,
          sentAt: new Date(),
          success: false,
          errorMessage: error.message,
        },
      });
    }
  }
}

/**
 * Calculate next schedule time for recurring notifications
 */
function calculateNextSchedule(notification: any): Date | null {
  const current = new Date(notification.scheduledFor);
  const recurrence = notification.recurrence as any;

  if (!recurrence) return null;

  // Check if we've reached the end date
  if (recurrence.endDate && new Date(recurrence.endDate) < current) {
    return null;
  }

  let next: Date;

  switch (notification.scheduleType) {
    case 'daily':
      next = new Date(current);
      next.setDate(current.getDate() + (recurrence.frequency || 1));
      break;

    case 'weekly':
      next = new Date(current);
      if (recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
        // Find next day of week
        const currentDay = current.getDay();
        const nextDays = recurrence.daysOfWeek.filter((d: number) => d > currentDay);

        if (nextDays.length > 0) {
          next.setDate(current.getDate() + (nextDays[0] - currentDay));
        } else {
          // Wrap to next week
          next.setDate(current.getDate() + (7 - currentDay + recurrence.daysOfWeek[0]));
        }
      } else {
        next.setDate(current.getDate() + 7 * (recurrence.frequency || 1));
      }
      break;

    case 'monthly':
      next = new Date(current);
      if (recurrence.daysOfMonth && recurrence.daysOfMonth.length > 0) {
        // Find next day of month
        const currentDate = current.getDate();
        const nextDates = recurrence.daysOfMonth.filter((d: number) => d > currentDate);

        if (nextDates.length > 0) {
          next.setDate(nextDates[0]);
        } else {
          // Move to next month
          next.setMonth(current.getMonth() + 1);
          next.setDate(recurrence.daysOfMonth[0]);
        }
      } else {
        next.setMonth(current.getMonth() + (recurrence.frequency || 1));
      }
      break;

    default:
      return null;
  }

  return next;
}

/**
 * Get notification statistics for a user
 */
export async function getNotificationStats(userId: string) {
  const [total, active, sent, pending] = await Promise.all([
    prisma.scheduledNotification.count({ where: { userId } }),
    prisma.scheduledNotification.count({ where: { userId, isActive: true } }),
    prisma.scheduledNotification.count({ where: { userId, isSent: true } }),
    prisma.scheduledNotification.count({ where: { userId, isActive: true, isSent: false } }),
  ]);

  return { total, active, sent, pending };
}

/**
 * Process scheduled calls and notify participants
 */
export async function processScheduledCalls() {
  const now = new Date();
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  // 1. Find calls starting in 5 minutes that haven't been notified yet
  const upcomingCalls = await prisma.call.findMany({
    where: {
      status: 'scheduled',
      scheduledFor: {
        lte: fiveMinutesFromNow,
        gt: now,
      },
      metadata: {
        path: ['notified5m'],
        equals: null,
      },
    },
    include: {
      initiator: true,
    },
  });

  for (const call of upcomingCalls) {
    await notifyCallParticipants(call, 'Starting in 5 minutes');

    // Update metadata to avoid double notification
    const metadata = (call.metadata as any) || {};
    await prisma.call.update({
      where: { id: call.id },
      data: { metadata: { ...metadata, notified5m: true } },
    });
  }

  // 2. Find calls starting now that haven't been notified yet
  const startingCalls = await prisma.call.findMany({
    where: {
      status: 'scheduled',
      scheduledFor: {
        lte: now,
      },
      metadata: {
        path: ['notifiedStart'],
        equals: null,
      },
    },
    include: {
      initiator: true,
    },
  });

  for (const call of startingCalls) {
    await notifyCallParticipants(call, 'Starting now');

    // Update status and metadata
    const metadata = (call.metadata as any) || {};
    await prisma.call.update({
      where: { id: call.id },
      data: {
        status: 'pending', // Move to pending so it shows up as an active call
        metadata: { ...metadata, notifiedStart: true },
      },
    });
  }
}

async function notifyCallParticipants(call: any, timeLabel: string) {
  const { workspaceId, channelId, title, initiator } = call;

  let userIds: string[] = [];

  if (channelId) {
    const members = await prisma.channelMember.findMany({
      where: { channelId },
      select: { userId: true },
    });
    userIds = members.map(m => m.userId);
  } else if (workspaceId) {
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      select: { userId: true },
    });
    userIds = members.map(m => m.userId);
  }

  const workspace = workspaceId ? await prisma.workspace.findUnique({ where: { id: workspaceId } }) : null;

  for (const userId of userIds) {
    if (userId === initiator?.id) continue;

    await createNotification({
      userId,
      type: 'system',
      title: `Call: ${title}`,
      message: `${timeLabel}: ${title} scheduled by ${initiator?.name || 'Someone'}`,
      entityType: (channelId ? 'channel' : 'workspace') as any,
      entityId: channelId || workspaceId,
      linkUrl: workspace ? `/workspace/${workspace.slug}` : undefined,
      metadata: {
        callId: call.id,
        type: call.type,
      },
    });
  }
}

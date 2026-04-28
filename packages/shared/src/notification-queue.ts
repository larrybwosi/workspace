import { prisma } from '@repo/database';
import { sendPushNotification } from './push-notifications';

/**
 * Queue a notification for background delivery.
 * Part of the "guaranteed delivery" enterprise system.
 */
export async function queueNotification(payload: {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  linkUrl?: string;
  notificationId?: string;
}) {
  return prisma.notificationQueue.create({
    data: {
      userId: payload.userId,
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
      imageUrl: payload.imageUrl,
      linkUrl: payload.linkUrl,
      notificationId: payload.notificationId,
      status: 'pending',
    },
  });
}

/**
 * Process the notification queue.
 * Should be called by a cron job or worker.
 */
export async function processNotificationQueue() {
  const pendingJobs = await prisma.notificationQueue.findMany({
    where: {
      status: { in: ['pending', 'failed'] },
      retryCount: { lt: 3 }, // Simple retry logic
      scheduledFor: { lte: new Date() },
    },
    take: 50,
    orderBy: { createdAt: 'asc' },
  });

  if (pendingJobs.length === 0) return;

  console.log(`[Notification Queue] Processing ${pendingJobs.length} jobs`);

  for (const job of pendingJobs) {
    // Mark as processing
    await prisma.notificationQueue.update({
      where: { id: job.id },
      data: { status: 'processing' },
    });

    try {
      await sendPushNotification({
        userId: job.userId,
        title: job.title,
        body: job.body,
        data: job.data as Record<string, string>,
        imageUrl: job.imageUrl || undefined,
        linkUrl: job.linkUrl || undefined,
        notificationId: job.notificationId || undefined,
      });

      // Mark as sent
      await prisma.notificationQueue.update({
        where: { id: job.id },
        data: { status: 'sent' },
      });
    } catch (error: any) {
      console.error(`[Notification Queue] Failed to process job ${job.id}:`, error);

      // Mark as failed and increment retry count
      await prisma.notificationQueue.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          retryCount: { increment: 1 },
          lastError: error.message,
          scheduledFor: new Date(Date.now() + 5 * 60 * 1000), // Retry in 5 minutes
        },
      });
    }
  }
}

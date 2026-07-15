import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { processScheduledNotifications, processScheduledCalls, processNotificationQueue } from '@repo/shared/server';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    this.logger.debug('Running scheduled notifications, calls and queue task');

    try {
      await processScheduledNotifications();
    } catch (error: any) {
      if (error && error.code === 'P2021') {
        this.logger.warn('Scheduled notifications table does not exist in the current database. Skipping task.');
      } else {
        this.logger.error('Error in processScheduledNotifications:', error);
      }
    }

    try {
      await processScheduledCalls();
    } catch (error: any) {
      if (error && error.code === 'P2021') {
        this.logger.warn('Calls or channel/workspace member tables do not exist in the current database. Skipping task.');
      } else {
        this.logger.error('Error in processScheduledCalls:', error);
      }
    }

    try {
      await processNotificationQueue();
    } catch (error: any) {
      if (error && error.code === 'P2021') {
        this.logger.warn('Notification queue table does not exist in the current database. Skipping task.');
      } else {
        this.logger.error('Error in processNotificationQueue:', error);
      }
    }
  }
}

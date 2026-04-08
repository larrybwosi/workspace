import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { processScheduledNotifications, processScheduledCalls } from '@repo/shared';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    this.logger.debug('Running scheduled notifications and calls task');
    try {
      await processScheduledNotifications();
      await processScheduledCalls();
    } catch (error) {
      this.logger.error('Error in TasksService cron job:', error);
    }
  }
}

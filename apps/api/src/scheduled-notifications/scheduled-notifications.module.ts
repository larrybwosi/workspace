import { Module } from '@nestjs/common';
import { ScheduledNotificationsController } from './scheduled-notifications.controller';

@Module({
  controllers: [ScheduledNotificationsController],
})
export class ScheduledNotificationsModule {}

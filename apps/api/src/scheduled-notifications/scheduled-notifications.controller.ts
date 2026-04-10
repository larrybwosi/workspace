import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User } from '@repo/database';
import {
  createScheduledNotification,
  getUserScheduledNotifications,
  getNotificationStats,
  updateScheduledNotification,
  deleteScheduledNotification,
  pauseScheduledNotification,
  resumeScheduledNotification,
} from '@repo/shared/server';

@Controller('scheduled-notifications')
@UseGuards(AuthGuard)
export class ScheduledNotificationsController {
  @Get()
  async getNotifications(
    @CurrentUser() user: User,
    @Query('stats') stats?: string,
  ) {
    if (stats === 'true') {
      return getNotificationStats(user.id);
    }
    return getUserScheduledNotifications(user.id);
  }

  @Post()
  async createNotification(
    @CurrentUser() user: User,
    @Body() body: any,
  ) {
    const { title, message, scheduleType, scheduledFor, recurrence, entityType, entityId, linkUrl, metadata } = body;
    return createScheduledNotification({
      userId: user.id,
      title,
      message,
      scheduleType,
      scheduledFor: new Date(scheduledFor),
      recurrence,
      entityType,
      entityId,
      linkUrl,
      metadata,
    });
  }

  @Patch(':id')
  async updateNotification(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const { action, ...updates } = body;
    if (action === 'pause') {
      return pauseScheduledNotification(id);
    } else if (action === 'resume') {
      return resumeScheduledNotification(id);
    }
    return updateScheduledNotification(id, updates);
  }

  @Delete(':id')
  async deleteNotification(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return deleteScheduledNotification(id);
  }
}

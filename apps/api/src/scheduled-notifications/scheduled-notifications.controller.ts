import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiProperty,
} from '@nestjs/swagger';
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
import { IsString, IsEnum, IsOptional } from 'class-validator';

class CreateScheduledNotificationDto {
  @IsString()
  @ApiProperty({ example: 'Reminder' })
  title: string;

  @IsString()
  @ApiProperty({ example: 'Meeting in 10 minutes' })
  message: string;

  @IsEnum(['custom', 'once', 'daily', 'weekly', 'monthly'])
  @ApiProperty({ enum: ['custom', 'once', 'daily', 'weekly', 'monthly'], example: 'once' })
  scheduleType: 'custom' | 'once' | 'daily' | 'weekly' | 'monthly';

  @IsString()
  @ApiProperty({ description: 'ISO format datetime' })
  scheduledFor: string;

  @IsOptional()
  @ApiProperty({ required: false, type: Object })
  recurrence?: any;

  @IsEnum(['channel'])
  @IsOptional()
  @ApiProperty({ required: false, enum: ['channel'] })
  entityType?: 'channel';

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  entityId?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  linkUrl?: string;

  @IsOptional()
  @ApiProperty({ required: false })
  metadata?: any;
}

@ApiTags('Scheduled Notifications')
@ApiBearerAuth()
@Controller('scheduled-notifications')
@UseGuards(AuthGuard)
export class ScheduledNotificationsController {
  @Get()
  @ApiOperation({ summary: 'Get scheduled notifications for the current user' })
  @ApiQuery({ name: 'stats', required: false, description: 'Return stats instead of list' })
  @ApiResponse({ status: 200, description: 'List of scheduled notifications or stats' })
  async getNotifications(@CurrentUser() user: User, @Query('stats') stats?: string) {
    if (stats === 'true') {
      return getNotificationStats(user.id);
    }
    return getUserScheduledNotifications(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a scheduled notification' })
  @ApiBody({ type: CreateScheduledNotificationDto })
  @ApiResponse({ status: 201, description: 'Notification scheduled' })
  async createNotification(@CurrentUser() user: User, @Body() body: CreateScheduledNotificationDto) {
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
  @ApiOperation({ summary: 'Update a scheduled notification' })
  @ApiParam({ name: 'id', description: 'The notification ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['pause', 'resume'] },
        title: { type: 'string' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Notification updated' })
  async updateNotification(@CurrentUser() user: User, @Param('id') id: string, @Body() body: any) {
    const { action, ...updates } = body;
    if (action === 'pause') {
      return pauseScheduledNotification(id);
    } else if (action === 'resume') {
      return resumeScheduledNotification(id);
    }
    return updateScheduledNotification(id, updates);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a scheduled notification' })
  @ApiParam({ name: 'id', description: 'The notification ID' })
  @ApiResponse({ status: 200, description: 'Notification deleted' })
  async deleteNotification(@CurrentUser() user: User, @Param('id') id: string) {
    return deleteScheduledNotification(id);
  }
}

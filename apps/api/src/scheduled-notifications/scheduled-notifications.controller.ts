import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, NotFoundException } from '@nestjs/common';
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

/**
 * THREAT MITIGATION: Input Validation & Mass Assignment Protection
 * Explicit DTO class with class-validator prevents arbitrary property injection during updates.
 */
class UpdateScheduledNotificationDto {
  @IsOptional()
  @IsEnum(['pause', 'resume'])
  @ApiProperty({ required: false, enum: ['pause', 'resume'] })
  action?: 'pause' | 'resume';

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, example: 'Updated title' })
  title?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, example: 'Updated message' })
  message?: string;

  @IsOptional()
  @IsEnum(['custom', 'once', 'daily', 'weekly', 'monthly'])
  @ApiProperty({ required: false, enum: ['custom', 'once', 'daily', 'weekly', 'monthly'] })
  scheduleType?: 'custom' | 'once' | 'daily' | 'weekly' | 'monthly';

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'ISO format datetime' })
  scheduledFor?: string;
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

  /**
   * THREAT MITIGATION: BOLA/IDOR Prevention & Input Validation
   * Passes user.id to verify ownership before modifying and validates payload via UpdateScheduledNotificationDto.
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update a scheduled notification' })
  @ApiParam({ name: 'id', description: 'The notification ID' })
  @ApiBody({ type: UpdateScheduledNotificationDto })
  @ApiResponse({ status: 200, description: 'Notification updated' })
  async updateNotification(@CurrentUser() user: User, @Param('id') id: string, @Body() body: UpdateScheduledNotificationDto) {
    const { action, ...updates } = body;
    try {
      if (action === 'pause') {
        return await pauseScheduledNotification(id, user.id);
      } else if (action === 'resume') {
        return await resumeScheduledNotification(id, user.id);
      }
      return await updateScheduledNotification(id, updates, user.id);
    } catch (error: any) {
      if (error.message?.includes('not found or access denied')) {
        throw new NotFoundException('Scheduled notification not found');
      }
      throw error;
    }
  }

  /**
   * THREAT MITIGATION: BOLA/IDOR Prevention
   * Passes user.id to verify ownership before deleting a scheduled notification.
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a scheduled notification' })
  @ApiParam({ name: 'id', description: 'The notification ID' })
  @ApiResponse({ status: 200, description: 'Notification deleted' })
  async deleteNotification(@CurrentUser() user: User, @Param('id') id: string) {
    try {
      return await deleteScheduledNotification(id, user.id);
    } catch (error: any) {
      if (error.message?.includes('not found or access denied')) {
        throw new NotFoundException('Scheduled notification not found');
      }
      throw error;
    }
  }
}

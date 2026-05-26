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
import { NotificationsService } from './notifications.service';

class WorkspaceSettingsDto {
  @ApiProperty({ example: 'workspace_123' })
  workspaceId: string;

  @ApiProperty({ enum: ['all', 'mentions', 'none'], example: 'all' })
  preference: string;
}

class ChannelSettingsDto {
  @ApiProperty({ example: 'channel_123' })
  channelId: string;

  @ApiProperty({ enum: ['all', 'mentions', 'none', 'default'], example: 'all' })
  preference: string;
}

class UpdateNotificationDto {
  @ApiProperty({ example: true })
  isRead: boolean;
}

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get notifications for the current user' })
  @ApiQuery({ name: 'unreadOnly', required: false, description: 'Filter by unread only' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of notifications to return' })
  @ApiResponse({ status: 200, description: 'List of notifications' })
  async getNotifications(
    @CurrentUser() user: User,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('limit') limit?: string
  ) {
    const isUnreadOnly = unreadOnly === 'true';
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.notificationsService.getNotifications(user.id, isUnreadOnly, limitNum);
  }

  @Post('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 201, description: 'All notifications marked as read' })
  async markAllRead(@CurrentUser() user: User) {
    return this.notificationsService.markAllRead(user.id);
  }

  @Get('settings/workspace')
  @ApiOperation({ summary: 'Get notification settings for a workspace' })
  @ApiQuery({ name: 'workspaceId', description: 'The workspace ID' })
  @ApiResponse({ status: 200, description: 'Workspace notification settings' })
  async getWorkspaceSettings(@CurrentUser() user: User, @Query('workspaceId') workspaceId: string) {
    return this.notificationsService.getWorkspaceSettings(user.id, workspaceId);
  }

  @Patch('settings/workspace')
  @ApiOperation({ summary: 'Update notification settings for a workspace' })
  @ApiBody({ type: WorkspaceSettingsDto })
  @ApiResponse({ status: 200, description: 'Workspace notification settings updated' })
  async updateWorkspaceSettings(@CurrentUser() user: User, @Body() body: WorkspaceSettingsDto) {
    return this.notificationsService.updateWorkspaceSettings(user.id, body.workspaceId, body.preference);
  }

  @Get('settings/channel')
  @ApiOperation({ summary: 'Get notification settings for a channel' })
  @ApiQuery({ name: 'channelId', description: 'The channel ID' })
  @ApiResponse({ status: 200, description: 'Channel notification settings' })
  async getChannelSettings(@CurrentUser() user: User, @Query('channelId') channelId: string) {
    return this.notificationsService.getChannelSettings(user.id, channelId);
  }

  @Patch('settings/channel')
  @ApiOperation({ summary: 'Update notification settings for a channel' })
  @ApiBody({ type: ChannelSettingsDto })
  @ApiResponse({ status: 200, description: 'Channel notification settings updated' })
  async updateChannelSettings(@CurrentUser() user: User, @Body() body: ChannelSettingsDto) {
    return this.notificationsService.updateChannelSettings(user.id, body.channelId, body.preference);
  }

  @Patch(':notificationId')
  @ApiOperation({ summary: 'Update a notification (e.g. mark as read)' })
  @ApiParam({ name: 'notificationId', description: 'The notification ID' })
  @ApiBody({ type: UpdateNotificationDto })
  @ApiResponse({ status: 200, description: 'Notification updated' })
  async updateNotification(
    @CurrentUser() user: User,
    @Param('notificationId') notificationId: string,
    @Body() body: UpdateNotificationDto
  ) {
    return this.notificationsService.updateNotification(user.id, notificationId, body.isRead);
  }

  @Delete(':notificationId')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiParam({ name: 'notificationId', description: 'The notification ID' })
  @ApiResponse({ status: 200, description: 'Notification deleted' })
  async deleteNotification(@CurrentUser() user: User, @Param('notificationId') notificationId: string) {
    return this.notificationsService.deleteNotification(user.id, notificationId);
  }
}

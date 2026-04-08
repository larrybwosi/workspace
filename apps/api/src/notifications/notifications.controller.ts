import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User } from '@repo/database';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @CurrentUser() user: User,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('limit') limit?: string,
  ) {
    const isUnreadOnly = unreadOnly === 'true';
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.notificationsService.getNotifications(user.id, isUnreadOnly, limitNum);
  }

  @Post('mark-all-read')
  async markAllRead(@CurrentUser() user: User) {
    return this.notificationsService.markAllRead(user.id);
  }

  @Get('settings/workspace')
  async getWorkspaceSettings(
    @CurrentUser() user: User,
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.notificationsService.getWorkspaceSettings(user.id, workspaceId);
  }

  @Patch('settings/workspace')
  async updateWorkspaceSettings(
    @CurrentUser() user: User,
    @Body() body: { workspaceId: string; preference: string },
  ) {
    return this.notificationsService.updateWorkspaceSettings(user.id, body.workspaceId, body.preference);
  }

  @Get('settings/channel')
  async getChannelSettings(
    @CurrentUser() user: User,
    @Query('channelId') channelId: string,
  ) {
    return this.notificationsService.getChannelSettings(user.id, channelId);
  }

  @Patch('settings/channel')
  async updateChannelSettings(
    @CurrentUser() user: User,
    @Body() body: { channelId: string; preference: string },
  ) {
    return this.notificationsService.updateChannelSettings(user.id, body.channelId, body.preference);
  }

  @Patch(':notificationId')
  async updateNotification(
    @CurrentUser() user: User,
    @Param('notificationId') notificationId: string,
    @Body() body: { isRead: boolean },
  ) {
    return this.notificationsService.updateNotification(user.id, notificationId, body.isRead);
  }

  @Delete(':notificationId')
  async deleteNotification(
    @CurrentUser() user: User,
    @Param('notificationId') notificationId: string,
  ) {
    return this.notificationsService.deleteNotification(user.id, notificationId);
  }
}

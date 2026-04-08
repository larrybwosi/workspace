import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User } from '@repo/database';
import { FriendsService } from './friends.service';

@Controller('friends')
@UseGuards(AuthGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get()
  async getFriends(@CurrentUser() user: User, @Query('search') search?: string) {
    const friends = await this.friendsService.getFriends(user.id, search);
    return { friends };
  }

  @Get('requests')
  async getFriendRequests(
    @CurrentUser() user: User,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    const requests = await this.friendsService.getFriendRequests(user.id, type, status);
    return { requests };
  }

  @Post('requests')
  async sendFriendRequest(
    @CurrentUser() user: User,
    @Body() body: { receiverId: string; message?: string },
  ) {
    const request = await this.friendsService.sendFriendRequest(
      user.id,
      user.name || 'Someone',
      body.receiverId,
      body.message,
    );
    return { request };
  }

  @Patch('requests/:requestId')
  async updateFriendRequest(
    @CurrentUser() user: User,
    @Param('requestId') requestId: string,
    @Body() body: { action: 'accept' | 'decline' | 'cancel' },
  ) {
    const request = await this.friendsService.updateFriendRequest(user.id, requestId, body.action);
    return { request };
  }

  @Delete('requests/:requestId')
  async deleteFriendRequest(@CurrentUser() user: User, @Param('requestId') requestId: string) {
    return this.friendsService.deleteFriendRequest(user.id, requestId);
  }
}

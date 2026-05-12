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
import { FriendsService } from './friends.service';

class SendFriendRequestDto {
  @ApiProperty({ example: 'user_123', description: 'The ID of the user to send a request to' })
  receiverId: string;

  @ApiProperty({ required: false, example: "Hi, let's be friends!" })
  message?: string;
}

class UpdateFriendRequestDto {
  @ApiProperty({ enum: ['accept', 'decline', 'cancel'], example: 'accept' })
  action: 'accept' | 'decline' | 'cancel';
}

@ApiTags('Friends')
@ApiBearerAuth()
@Controller('friends')
@UseGuards(AuthGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get()
  @ApiOperation({ summary: 'Get list of friends' })
  @ApiQuery({ name: 'search', required: false, description: 'Search for friends by name' })
  @ApiResponse({ status: 200, description: 'List of friends' })
  async getFriends(@CurrentUser() user: User, @Query('search') search?: string) {
    const friends = await this.friendsService.getFriends(user.id, search);
    return { friends };
  }

  @Get('requests')
  @ApiOperation({ summary: 'Get friend requests' })
  @ApiQuery({ name: 'type', required: false, enum: ['incoming', 'outgoing'], description: 'Type of requests' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'accepted', 'declined'],
    description: 'Status of requests',
  })
  @ApiResponse({ status: 200, description: 'List of friend requests' })
  async getFriendRequests(@CurrentUser() user: User, @Query('type') type?: string, @Query('status') status?: string) {
    const requests = await this.friendsService.getFriendRequests(user.id, type, status);
    return { requests };
  }

  @Post('requests')
  @ApiOperation({ summary: 'Send a friend request' })
  @ApiBody({ type: SendFriendRequestDto })
  @ApiResponse({ status: 201, description: 'Friend request sent' })
  async sendFriendRequest(@CurrentUser() user: User, @Body() body: SendFriendRequestDto) {
    const request = await this.friendsService.sendFriendRequest(
      user.id,
      user.name || 'Someone',
      body.receiverId,
      body.message
    );
    return { request };
  }

  @Patch('requests/:requestId')
  @ApiOperation({ summary: 'Accept, decline or cancel a friend request' })
  @ApiParam({ name: 'requestId', description: 'The request ID' })
  @ApiBody({ type: UpdateFriendRequestDto })
  @ApiResponse({ status: 200, description: 'Friend request updated' })
  async updateFriendRequest(
    @CurrentUser() user: User,
    @Param('requestId') requestId: string,
    @Body() body: UpdateFriendRequestDto
  ) {
    const request = await this.friendsService.updateFriendRequest(user.id, requestId, body.action);
    return { request };
  }

  @Delete('requests/:requestId')
  @ApiOperation({ summary: 'Delete a friend request or unfriend' })
  @ApiParam({ name: 'requestId', description: 'The request ID' })
  @ApiResponse({ status: 200, description: 'Friend request or friendship deleted' })
  async deleteFriendRequest(@CurrentUser() user: User, @Param('requestId') requestId: string) {
    return this.friendsService.deleteFriendRequest(user.id, requestId);
  }
}

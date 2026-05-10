import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User } from '@repo/database';
import { ChannelsService } from './channels.service';

@ApiTags('Channels')
@ApiBearerAuth()
@Controller('channels')
@UseGuards(AuthGuard)
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Get()
  @ApiOperation({ summary: 'Get global channels' })
  @ApiResponse({ status: 200, description: 'List of global channels' })
  async getGlobalChannels() {
    return this.channelsService.getGlobalChannels();
  }

  @Post()
  @ApiOperation({ summary: 'Create a global channel' })
  @ApiResponse({ status: 201, description: 'Channel created' })
  async createChannel(@Body() body: any) {
    return this.channelsService.createChannel(body);
  }

  @Get(':channelId/messages')
  @ApiOperation({ summary: 'Get messages from a channel' })
  @ApiParam({ name: 'channelId', description: 'The channel ID' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'List of messages' })
  async getMessages(
    @Param('channelId') channelId: string,
    @CurrentUser() user: User,
    @Query('cursor') cursor?: string,
    @Query('limit') limitNum = '50'
  ) {
    return this.channelsService.getMessages(channelId, user.id, cursor, parseInt(limitNum));
  }

  @Post(':channelId/messages')
  @ApiOperation({ summary: 'Send a message to a channel' })
  @ApiParam({ name: 'channelId', description: 'The channel ID' })
  @ApiResponse({ status: 201, description: 'Message sent' })
  async createMessage(@Param('channelId') channelId: string, @CurrentUser() user: User, @Body() body: any) {
    return this.channelsService.createMessage(channelId, user.id, body);
  }

  @Patch(':channelId/messages/:messageId')
  @ApiOperation({ summary: 'Update a message' })
  @ApiParam({ name: 'channelId', description: 'The channel ID' })
  @ApiParam({ name: 'messageId', description: 'The message ID' })
  @ApiBody({ schema: { type: 'object', properties: { content: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Message updated' })
  async updateMessage(
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: User,
    @Body() body: { content: string }
  ) {
    return this.channelsService.updateMessage(channelId, messageId, user.id, body.content);
  }

  @Delete(':channelId/messages/:messageId')
  @ApiOperation({ summary: 'Delete a message' })
  @ApiParam({ name: 'channelId', description: 'The channel ID' })
  @ApiParam({ name: 'messageId', description: 'The message ID' })
  @ApiResponse({ status: 200, description: 'Message deleted' })
  async deleteMessage(@Param('channelId') channelId: string, @Param('messageId') messageId: string) {
    return this.channelsService.deleteMessage(channelId, messageId);
  }

  @Post(':channelId/messages/read')
  @ApiOperation({ summary: 'Mark messages as read' })
  @ApiParam({ name: 'channelId', description: 'The channel ID' })
  @ApiBody({ schema: { type: 'object', properties: { messageIds: { type: 'array', items: { type: 'string' } } } } })
  @ApiResponse({ status: 201, description: 'Messages marked as read' })
  async markAsRead(
    @Param('channelId') channelId: string,
    @CurrentUser() user: User,
    @Body() body: { messageIds: string[] }
  ) {
    return this.channelsService.markAsRead(user.id, body.messageIds, channelId);
  }

  @Post(':channelId/messages/:messageId/reactions')
  @ApiOperation({ summary: 'Add a reaction to a message' })
  @ApiParam({ name: 'channelId', description: 'The channel ID' })
  @ApiParam({ name: 'messageId', description: 'The message ID' })
  @ApiBody({ schema: { type: 'object', properties: { emoji: { type: 'string' } } } })
  @ApiResponse({ status: 201, description: 'Reaction added' })
  async addReaction(
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: User,
    @Body() body: { emoji: string }
  ) {
    return this.channelsService.addReaction(channelId, messageId, user.id, body.emoji);
  }

  @Delete(':channelId/messages/:messageId/reactions/:emoji')
  @ApiOperation({ summary: 'Remove a reaction from a message' })
  @ApiParam({ name: 'channelId', description: 'The channel ID' })
  @ApiParam({ name: 'messageId', description: 'The message ID' })
  @ApiParam({ name: 'emoji', description: 'The emoji' })
  @ApiResponse({ status: 200, description: 'Reaction removed' })
  async removeReaction(
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @Param('emoji') emoji: string,
    @CurrentUser() user: User
  ) {
    return this.channelsService.removeReaction(channelId, messageId, user.id, emoji);
  }

  @Post(':channelId/share')
  @ApiOperation({ summary: 'Share a channel with another workspace' })
  async shareChannel(
    @Param('channelId') channelId: string,
    @Body('workspaceId') workspaceId: string
  ) {
    return this.channelsService.inviteWorkspaceToChannel(channelId, workspaceId);
  }

  @Post(':channelId/messages/:messageId/reply')
  @ApiOperation({ summary: 'Reply to a message' })
  @ApiParam({ name: 'channelId', description: 'The channel ID' })
  @ApiParam({ name: 'messageId', description: 'The message ID' })
  @ApiResponse({ status: 201, description: 'Reply sent' })
  async createReply(
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: User,
    @Body() body: any
  ) {
    return this.channelsService.createReply(channelId, messageId, user.id, body);
  }
}

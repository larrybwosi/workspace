import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User } from '@repo/database';
import { MessagesService } from './messages.service';

@Controller('channels/:id/messages')
@UseGuards(AuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  async getMessages(
    @Param('id') channelId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.messagesService.getMessages(channelId, cursor, limitNum);
  }

  @Post()
  async createMessage(
    @CurrentUser() user: User,
    @Param('id') channelId: string,
    @Body() body: any,
  ) {
    return this.messagesService.createMessage(user.id, { ...body, channelId });
  }

  @Get('search')
  async searchMessages(
    @CurrentUser() user: User,
    @Query('query') query: string,
    @Query('filter') filter?: string,
    @Query('channelId') channelId?: string,
  ) {
    return this.messagesService.searchMessages(user.id, query, filter, channelId);
  }

  @Post('read')
  async batchMarkAsRead(
    @CurrentUser() user: User,
    @Body('messageIds') messageIds: string[],
  ) {
    return this.messagesService.batchMarkAsRead(user.id, messageIds);
  }

  @Patch(':messageId')
  async updateMessage(
    @CurrentUser() user: User,
    @Param('messageId') messageId: string,
    @Body('content') content: string,
  ) {
    return this.messagesService.updateMessage(user.id, messageId, content);
  }

  @Delete(':messageId')
  async deleteMessage(
    @CurrentUser() user: User,
    @Param('messageId') messageId: string,
  ) {
    return this.messagesService.deleteMessage(user.id, messageId);
  }

  @Post(':messageId/reply')
  async createReply(
    @CurrentUser() user: User,
    @Param('messageId') messageId: string,
    @Body('content') content: string,
  ) {
    return this.messagesService.createReply(user.id, messageId, content);
  }

  @Post(':messageId/reactions')
  async toggleReaction(
    @CurrentUser() user: User,
    @Param('messageId') messageId: string,
    @Body() body: { emoji: string; customEmojiId?: string },
  ) {
    return this.messagesService.toggleReaction(user.id, messageId, body.emoji, body.customEmojiId);
  }

  @Post(':messageId/read')
  async markAsRead(
    @CurrentUser() user: User,
    @Param('messageId') messageId: string,
  ) {
    return this.messagesService.markMessageAsRead(user.id, messageId);
  }

  @Post(':messageId/action')
  async processAction(
    @CurrentUser() user: User,
    @Param('messageId') messageId: string,
    @Body() body: any,
  ) {
    return this.messagesService.processActionResponse(user.id, messageId, body);
  }

  @Get(':messageId/action')
  async getActionResponses(
    @Param('messageId') messageId: string,
  ) {
    return this.messagesService.getActionResponses(messageId);
  }
}

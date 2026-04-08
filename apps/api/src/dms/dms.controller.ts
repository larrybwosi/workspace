import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User } from '@repo/database';
import { DmsService } from './dms.service';

@Controller('dms')
@UseGuards(AuthGuard)
export class DmsController {
  constructor(private readonly dmsService: DmsService) {}

  @Get()
  async getDms(@CurrentUser() user: User) {
    return this.dmsService.getDms(user.id);
  }

  @Post()
  async createDm(@CurrentUser() user: User, @Body() body: { userId: string }) {
    return this.dmsService.createDm(user.id, body.userId, user.name || 'Someone');
  }

  @Get(':conversationId')
  async getDm(@Param('conversationId') conversationId: string, @CurrentUser() user: User) {
    const dm = await this.dmsService.getDm(conversationId, user.id);
    if (!dm) {
      throw new NotFoundException('DM not found');
    }
    return dm;
  }

  @Delete(':conversationId')
  async deleteDm(@Param('conversationId') conversationId: string) {
    return this.dmsService.deleteDm(conversationId);
  }

  @Get(':conversationId/messages')
  async getMessages(
    @Param('conversationId') conversationId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limitNum = '50',
  ) {
    return this.dmsService.getMessages(conversationId, cursor, parseInt(limitNum));
  }

  @Post(':conversationId/messages')
  async createMessage(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: User,
    @Body() body: any,
  ) {
    return this.dmsService.createMessage(conversationId, user.id, body);
  }

  @Patch(':conversationId/messages/:messageId')
  async updateMessage(
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: User,
    @Body() body: { content: string },
  ) {
    return this.dmsService.updateMessage(conversationId, messageId, user.id, body.content);
  }

  @Delete(':conversationId/messages/:messageId')
  async deleteMessage(
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.dmsService.deleteMessage(conversationId, messageId);
  }

  @Post(':conversationId/messages/read')
  async markAsRead(
    @CurrentUser() user: User,
    @Body() body: { messageIds: string[] },
  ) {
    return this.dmsService.markAsRead(user.id, body.messageIds);
  }

  @Post(':conversationId/messages/:messageId/reactions')
  async addReaction(
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: User,
    @Body() body: { emoji: string },
  ) {
    return this.dmsService.addReaction(conversationId, messageId, user.id, body.emoji);
  }

  @Delete(':conversationId/messages/:messageId/reactions/:emoji')
  async removeReaction(
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @Param('emoji') emoji: string,
    @CurrentUser() user: User,
  ) {
    return this.dmsService.removeReaction(conversationId, messageId, user.id, emoji);
  }
}

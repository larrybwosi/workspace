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
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User } from '@repo/database';
import { MessagesService } from '@/messages/messages.service';

@Controller('workspaces/:slug/channels/:channelId/messages')
@UseGuards(AuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  async getMessages(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('channelId') channelId: string,
    @Query('cursor') cursor: string,
    @Query('limit') limitNum = '50'
  ) {
    await this.messagesService.verifyWorkspaceAccess(user.id, slug);
    return this.messagesService.getMessages(channelId, cursor, parseInt(limitNum));
  }

  @Post()
  async createMessage(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('channelId') channelId: string,
    @Body() body: any
  ) {
    await this.messagesService.verifyWorkspaceAccess(user.id, slug);
    return this.messagesService.createMessage(user.id, { ...body, channelId });
  }

  @Patch(':messageId')
  async updateMessage(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @Body() body: any
  ) {
    await this.messagesService.verifyWorkspaceAccess(user.id, slug);
    return this.messagesService.updateMessage(user.id, messageId, body.content);
  }

  @Delete(':messageId')
  async deleteMessage(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string
  ) {
    await this.messagesService.verifyWorkspaceAccess(user.id, slug);
    return this.messagesService.deleteMessage(user.id, messageId);
  }

  @Post('read')
  async markAsRead(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('channelId') channelId: string,
    @Body() body: any
  ) {
    await this.messagesService.verifyWorkspaceAccess(user.id, slug);

    if (!Array.isArray(body.messageIds)) {
      throw new BadRequestException('Invalid messageIds');
    }

    return this.messagesService.batchMarkAsRead(user.id, body.messageIds);
  }

  @Post(':messageId/reactions')
  async addReaction(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @Body() body: any
  ) {
    await this.messagesService.verifyWorkspaceAccess(user.id, slug);
    return this.messagesService.addReaction(user.id, messageId, body.emoji, body.customEmojiId);
  }

  @Delete(':messageId/reactions/:emoji')
  async removeReaction(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @Param('emoji') emoji: string
  ) {
    await this.messagesService.verifyWorkspaceAccess(user.id, slug);
    return this.messagesService.removeReaction(user.id, messageId, emoji);
  }

  @Post(':messageId/replies')
  async createReply(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @Body() body: any
  ) {
    await this.messagesService.verifyWorkspaceAccess(user.id, slug);
    // Delegate entirely to createMessage so replies inherit mention, attachment, and sticker logic automatically
    return this.messagesService.createMessage(user.id, {
      ...body,
      channelId,
      replyToId: messageId,
    });
  }
}

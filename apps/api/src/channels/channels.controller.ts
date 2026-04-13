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
import { ChannelsService } from './channels.service';

@Controller('channels')
@UseGuards(AuthGuard)
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Get()
  async getGlobalChannels() {
    return this.channelsService.getGlobalChannels();
  }

  @Post()
  async createChannel(@Body() body: any) {
    return this.channelsService.createChannel(body);
  }

  @Get(':channelId/messages')
  async getMessages(
    @Param('channelId') channelId: string,
    @CurrentUser() user: User,
    @Query('cursor') cursor?: string,
    @Query('limit') limitNum = '50'
  ) {
    return this.channelsService.getMessages(channelId, user.id, cursor, parseInt(limitNum));
  }

  @Post(':channelId/messages')
  async createMessage(@Param('channelId') channelId: string, @CurrentUser() user: User, @Body() body: any) {
    return this.channelsService.createMessage(channelId, user.id, body);
  }

  @Patch(':channelId/messages/:messageId')
  async updateMessage(
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: User,
    @Body() body: { content: string }
  ) {
    return this.channelsService.updateMessage(channelId, messageId, user.id, body.content);
  }

  @Delete(':channelId/messages/:messageId')
  async deleteMessage(@Param('channelId') channelId: string, @Param('messageId') messageId: string) {
    return this.channelsService.deleteMessage(channelId, messageId);
  }

  @Post(':channelId/messages/read')
  async markAsRead(@CurrentUser() user: User, @Body() body: { messageIds: string[] }) {
    return this.channelsService.markAsRead(user.id, body.messageIds);
  }

  @Post(':channelId/messages/:messageId/reactions')
  async addReaction(
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: User,
    @Body() body: { emoji: string }
  ) {
    return this.channelsService.addReaction(channelId, messageId, user.id, body.emoji);
  }

  @Delete(':channelId/messages/:messageId/reactions/:emoji')
  async removeReaction(
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @Param('emoji') emoji: string,
    @CurrentUser() user: User
  ) {
    return this.channelsService.removeReaction(channelId, messageId, user.id, emoji);
  }

  @Post(':channelId/messages/:messageId/reply')
  async createReply(
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: User,
    @Body() body: any
  ) {
    return this.channelsService.createReply(channelId, messageId, user.id, body);
  }
}

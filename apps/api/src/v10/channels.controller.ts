import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, HttpCode } from '@nestjs/common';
import { ApiV10Guard } from '../auth/api-v10.guard';
import { CurrentBot } from '../auth/current-bot.decorator';
import { V10ChannelsService } from './channels.service';

@Controller('bot/v10/channels')
@UseGuards(ApiV10Guard)
export class V10ChannelsController {
  constructor(private readonly channelsService: V10ChannelsService) {}

  @Get(':id')
  async getChannel(@Param('id') id: string) {
    return this.channelsService.getChannel(id);
  }

  @Post(':id/messages')
  async createMessage(
    @CurrentBot() bot: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.channelsService.createMessage(bot, id, body);
  }

  @Get(':id/messages')
  async getMessages(
    @Param('id') id: string,
    @Param('limit') limit?: number,
    @Param('before') before?: string,
    @Param('after') after?: string,
  ) {
    return this.channelsService.getMessages(id, { limit, before, after });
  }

  @Patch(':id/messages/:messageId')
  async updateMessage(
    @CurrentBot() bot: any,
    @Param('id') channelId: string,
    @Param('messageId') messageId: string,
    @Body() body: any,
  ) {
    return this.channelsService.updateMessage(bot, channelId, messageId, body);
  }

  @Delete(':id/messages/:messageId')
  @HttpCode(204)
  async deleteMessage(
    @CurrentBot() bot: any,
    @Param('id') channelId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.channelsService.deleteMessage(bot, channelId, messageId);
  }
}

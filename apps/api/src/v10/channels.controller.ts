import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiV10Guard } from '../auth/api-v10.guard';
import { CurrentBot } from '../auth/current-bot.decorator';
import { V10ChannelsService } from './channels.service';

@Controller('bot/v10/channels')
@UseGuards(ApiV10Guard)
export class V10ChannelsController {
  constructor(private readonly channelsService: V10ChannelsService) {}

  @Post(':id/messages')
  async createMessage(
    @CurrentBot() bot: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.channelsService.createMessage(bot, id, body);
  }
}

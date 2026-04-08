import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { ChannelsService } from './channels.service';

@Controller('channels')
@UseGuards(AuthGuard)
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Get()
  async getChannels() {
    return this.channelsService.getChannels();
  }

  @Post()
  async createChannel(@Body() body: any) {
    return this.channelsService.createChannel(body);
  }
}

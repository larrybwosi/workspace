import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, HttpCode, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ApiV10Guard } from '../auth/api-v10.guard';
import { CurrentBot } from '../auth/current-bot.decorator';
import { V10ChannelsService } from './channels.service';

@ApiTags('V10 Channels')
@ApiBearerAuth()
@Controller('bot/v10/channels')
@UseGuards(ApiV10Guard)
export class V10ChannelsController {
  constructor(private readonly channelsService: V10ChannelsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get channel details' })
  @ApiParam({ name: 'id', description: 'The channel ID' })
  async getChannel(@Param('id') id: string) {
    return this.channelsService.getChannel(id);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send a message to a channel' })
  @ApiParam({ name: 'id', description: 'The channel ID' })
  async createMessage(@CurrentBot() bot: any, @Param('id') id: string, @Body() body: any) {
    return this.channelsService.createMessage(bot, id, body);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get messages from a channel' })
  @ApiParam({ name: 'id', description: 'The channel ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'before', required: false })
  @ApiQuery({ name: 'after', required: false })
  async getMessages(
    @Param('id') id: string,
    @Query('limit') limit?: number,
    @Query('before') before?: string,
    @Query('after') after?: string
  ) {
    return this.channelsService.getMessages(id, { limit, before, after });
  }

  @Patch(':id/messages/:messageId')
  @ApiOperation({ summary: 'Update a message' })
  @ApiParam({ name: 'id', description: 'The channel ID' })
  @ApiParam({ name: 'messageId', description: 'The message ID' })
  async updateMessage(
    @CurrentBot() bot: any,
    @Param('id') channelId: string,
    @Param('messageId') messageId: string,
    @Body() body: any
  ) {
    return this.channelsService.updateMessage(bot, channelId, messageId, body);
  }

  @Delete(':id/messages/:messageId')
  @ApiOperation({ summary: 'Delete a message' })
  @ApiParam({ name: 'id', description: 'The channel ID' })
  @ApiParam({ name: 'messageId', description: 'The message ID' })
  @HttpCode(204)
  async deleteMessage(@CurrentBot() bot: any, @Param('id') channelId: string, @Param('messageId') messageId: string) {
    return this.channelsService.deleteMessage(bot, channelId, messageId);
  }
}

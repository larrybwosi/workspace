import { Controller, Get, Put, Delete, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiV10Guard } from '../auth/api-v10.guard';
import { CurrentBot } from '../auth/current-bot.decorator';
import { V10GuildsService } from './guilds.service';

@Controller('bot/v10/guilds')
@UseGuards(ApiV10Guard)
export class V10GuildsController {
  constructor(private readonly guildsService: V10GuildsService) {}

  @Get(':guildId')
  async getGuild(
    @CurrentBot() bot: any,
    @Param('guildId') guildId: string,
  ) {
    return this.guildsService.getGuild(bot, guildId);
  }

  @Get(':guildId/channels')
  async getChannels(
    @CurrentBot() bot: any,
    @Param('guildId') guildId: string,
  ) {
    return this.guildsService.getChannels(bot, guildId);
  }

  @Get(':guildId/members')
  async getMembers(
    @CurrentBot() bot: any,
    @Param('guildId') guildId: string,
    @Param('limit') limit?: number,
    @Param('after') after?: string,
  ) {
    return this.guildsService.getMembers(bot, guildId, { limit, after });
  }

  @Get(':guildId/roles')
  async getRoles(
    @CurrentBot() bot: any,
    @Param('guildId') guildId: string,
  ) {
    return this.guildsService.getRoles(bot, guildId);
  }

  @Put(':guildId/members/:userId/roles/:roleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async addMemberRole(
    @CurrentBot() bot: any,
    @Param('guildId') guildId: string,
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.guildsService.addMemberRole(bot, guildId, userId, roleId);
  }

  @Delete(':guildId/members/:userId/roles/:roleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMemberRole(
    @CurrentBot() bot: any,
    @Param('guildId') guildId: string,
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.guildsService.removeMemberRole(bot, guildId, userId, roleId);
  }
}

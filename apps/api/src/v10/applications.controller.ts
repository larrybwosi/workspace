import { Controller, Get, Post, Body, Param, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsInt } from 'class-validator';
import { ApiV10Guard } from '../auth/api-v10.guard';
import { CurrentBot } from '../auth/current-bot.decorator';
import { V10ApplicationsService } from './applications.service';

/**
 * THREAT MITIGATION: Mass Assignment & Unvalidated Input Injection (CWE-20 / CWE-915)
 * Risk Level: Medium
 * Using an explicit DTO class with class-validator decorators enforces runtime schema validation
 * via ValidationPipe, preventing arbitrary property injection and invalid payloads when registering
 * bot application commands.
 */
export class V10CreateApplicationCommandDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsOptional()
  @IsArray()
  options?: any[];

  @IsOptional()
  @IsInt()
  type?: number;
}

@Controller('bot/v10/applications')
@UseGuards(ApiV10Guard)
export class V10ApplicationsController {
  constructor(private readonly applicationsService: V10ApplicationsService) {}

  @Get(':id/commands')
  async getCommands(@CurrentBot() bot: any, @Param('id') id: string) {
    return this.applicationsService.getCommands(bot, id);
  }

  @Post(':id/commands')
  @HttpCode(HttpStatus.CREATED)
  async createCommand(
    @CurrentBot() bot: any,
    @Param('id') id: string,
    @Body() body: V10CreateApplicationCommandDto
  ) {
    return this.applicationsService.createCommand(bot, id, body);
  }

  @Get(':id/guilds/:guildId/commands')
  async getGuildCommands(@CurrentBot() bot: any, @Param('id') id: string, @Param('guildId') guildId: string) {
    return this.applicationsService.getGuildCommands(bot, id, guildId);
  }

  @Post(':id/guilds/:guildId/commands')
  @HttpCode(HttpStatus.CREATED)
  async createGuildCommand(
    @CurrentBot() bot: any,
    @Param('id') id: string,
    @Param('guildId') guildId: string,
    @Body() body: V10CreateApplicationCommandDto
  ) {
    return this.applicationsService.createGuildCommand(bot, id, guildId, body);
  }
}

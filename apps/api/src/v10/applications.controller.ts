import { Controller, Get, Post, Body, Param, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsInt, IsArray } from 'class-validator';
import { ApiV10Guard } from '../auth/api-v10.guard';
import { CurrentBot } from '../auth/current-bot.decorator';
import { V10ApplicationsService } from './applications.service';

/**
 * Security Hardening (Threat: Mass Assignment / Unvalidated Input Payload Injection - CWE-20 / CWE-915)
 * Risk Level: Medium
 * Using explicit DTO classes with class-validator decorators guarantees runtime type-checking,
 * validates required fields (name, description), and prevents arbitrary property injection on bot command creation.
 */
export class V10CreateApplicationCommandDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsArray()
  @IsOptional()
  options?: any[];

  @IsInt()
  @IsOptional()
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

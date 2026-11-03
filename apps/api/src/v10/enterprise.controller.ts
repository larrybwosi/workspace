import { Controller, Post, Body, Param, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { ApiV10Guard } from '../auth/api-v10.guard';
import { CurrentBot } from '../auth/current-bot.decorator';
import { V10EnterpriseService } from './enterprise.service';

/**
 * Security Hardening (Threat: Mass Assignment / Unvalidated Input Payload Injection - CWE-20 / CWE-915)
 * Using explicit DTO classes with class-validator decorators guarantees runtime type-checking,
 * validates priority against expected enum values, and prevents arbitrary property injection on bot announcement creation.
 */
export class V10CreateDepartmentAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  @IsIn(['low', 'normal', 'high', 'urgent'])
  priority?: string;
}

@Controller('bot/v10/enterprise')
@UseGuards(ApiV10Guard)
export class V10EnterpriseController {
  constructor(private readonly enterpriseService: V10EnterpriseService) {}

  @Post('departments/:id/announcements')
  @HttpCode(HttpStatus.CREATED)
  async createAnnouncement(
    @CurrentBot() bot: any,
    @Param('id') id: string,
    @Body() body: V10CreateDepartmentAnnouncementDto
  ) {
    return this.enterpriseService.createAnnouncement(bot, id, body);
  }
}

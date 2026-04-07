import { Controller, Post, Body, Param, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiV10Guard } from '../auth/api-v10.guard';
import { CurrentBot } from '../auth/current-bot.decorator';
import { V10EnterpriseService } from './enterprise.service';

@Controller('v10/enterprise')
@UseGuards(ApiV10Guard)
export class V10EnterpriseController {
  constructor(private readonly enterpriseService: V10EnterpriseService) {}

  @Post('departments/:id/announcements')
  @HttpCode(HttpStatus.CREATED)
  async createAnnouncement(
    @CurrentBot() bot: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.enterpriseService.createAnnouncement(bot, id, body);
  }
}

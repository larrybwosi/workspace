import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User } from '@repo/database';
import { CallsService } from './calls.service';

@Controller('calls')
@UseGuards(AuthGuard)
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Post()
  async startCall(@CurrentUser() user: User, @Body() body: any) {
    return this.callsService.startCall(user, body);
  }

  @Patch(':callId')
  async updateCall(
    @CurrentUser() user: User,
    @Param('callId') callId: string,
    @Body() body: any,
  ) {
    return this.callsService.updateCall(user, callId, body);
  }

  @Get(':callId/participants')
  async getParticipants(@Param('callId') callId: string) {
    return this.callsService.getParticipants(callId);
  }

  @Get('scheduled')
  async getScheduledCalls(
    @CurrentUser() user: User,
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.callsService.getScheduledCalls(user, workspaceId);
  }

  @Post('scheduled')
  async scheduleCall(@CurrentUser() user: User, @Body() body: any) {
    return this.callsService.scheduleCall(user, body);
  }

  @Post('soundboard')
  async playSoundboardSound(@CurrentUser() user: User, @Body() body: any) {
    return this.callsService.playSoundboardSound(user, body);
  }
}

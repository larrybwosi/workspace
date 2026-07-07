import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User } from '@repo/database';
import { CallsService } from './calls.service';
import { StartCallDto, UpdateCallDto, ScheduleCallDto, SoundboardSoundDto } from './dto/call-operations.dto';

@ApiTags('Calls')
@ApiBearerAuth()
@Controller('calls')
@UseGuards(AuthGuard)
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Post()
  @ApiOperation({ summary: 'Start a new call' })
  @ApiResponse({ status: 201, description: 'Call started' })
  async startCall(@CurrentUser() user: User, @Body() body: StartCallDto) {
    return this.callsService.startCall(user, body);
  }

  @Patch(':callId')
  @ApiOperation({ summary: 'Update call state' })
  @ApiParam({ name: 'callId', description: 'The call ID' })
  @ApiResponse({ status: 200, description: 'Call updated' })
  async updateCall(@CurrentUser() user: User, @Param('callId') callId: string, @Body() body: UpdateCallDto) {
    return this.callsService.updateCall(user, callId, body);
  }

  @Post(':callId/invite')
  @ApiOperation({ summary: 'Invite a user to a call' })
  @ApiParam({ name: 'callId', description: 'The call ID' })
  @ApiResponse({ status: 201, description: 'User invited' })
  async inviteToCall(@CurrentUser() user: User, @Param('callId') callId: string, @Body('userId') userId: string) {
    return this.callsService.inviteToCall(user, callId, userId);
  }

  @Get(':callId/participants')
  @ApiOperation({ summary: 'Get participants in a call' })
  @ApiParam({ name: 'callId', description: 'The call ID' })
  @ApiResponse({ status: 200, description: 'List of participants' })
  async getParticipants(@Param('callId') callId: string) {
    return this.callsService.getParticipants(callId);
  }

  @Get('scheduled')
  @ApiOperation({ summary: 'Get scheduled calls for a workspace' })
  @ApiQuery({ name: 'workspaceId', description: 'The workspace ID' })
  @ApiResponse({ status: 200, description: 'List of scheduled calls' })
  async getScheduledCalls(@CurrentUser() user: User, @Query('workspaceId') workspaceId: string) {
    return this.callsService.getScheduledCalls(user, workspaceId);
  }

  @Post('scheduled')
  @ApiOperation({ summary: 'Schedule a call' })
  @ApiResponse({ status: 201, description: 'Call scheduled' })
  async scheduleCall(@CurrentUser() user: User, @Body() body: ScheduleCallDto) {
    return this.callsService.scheduleCall(user, body);
  }

  @Post('soundboard')
  @ApiOperation({ summary: 'Play a soundboard sound' })
  @ApiResponse({ status: 201, description: 'Sound played' })
  async playSoundboardSound(@CurrentUser() user: User, @Body() body: SoundboardSoundDto) {
    return this.callsService.playSoundboardSound(user, body);
  }
}

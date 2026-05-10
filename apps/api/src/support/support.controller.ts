import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User } from '@repo/database';
import { SupportService } from './support.service';

@ApiTags('Support')
@ApiBearerAuth()
@Controller('support')
@UseGuards(AuthGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  @ApiOperation({ summary: 'Create a support ticket' })
  async createTicket(@CurrentUser() user: User, @Body() body: any) {
    return this.supportService.createTicket(
      body.workspaceId,
      user.id,
      body.subject,
      body.initialMessage
    );
  }

  @Get('tickets')
  @ApiOperation({ summary: 'Get support tickets' })
  async getTickets(
    @CurrentUser() user: User,
    @Query('workspaceId') workspaceId: string
  ) {
    return this.supportService.getTickets(workspaceId, user.id);
  }

  @Post('live-chat')
  @ApiOperation({ summary: 'Start a live chat session' })
  async startLiveChat(@CurrentUser() user: User, @Body() body: any) {
    return this.supportService.startLiveChat(body.workspaceId, user.id, body.metadata);
  }

  @Patch('live-chat/:sessionId/end')
  @ApiOperation({ summary: 'End a live chat session' })
  async endLiveChat(@Param('sessionId') sessionId: string) {
    return this.supportService.endLiveChat(sessionId);
  }

  @Patch('tickets/:ticketId/status')
  @ApiOperation({ summary: 'Update ticket status' })
  async updateTicketStatus(
    @Param('ticketId') ticketId: string,
    @Body('status') status: string
  ) {
    return this.supportService.updateTicketStatus(ticketId, status);
  }

  @Post('customers')
  @ApiOperation({ summary: 'Create or update customer profile' })
  async createCustomerProfile(@Body() body: any) {
    return this.supportService.createCustomerProfile(body.workspaceId, body.userId, body);
  }

  @Get('customers')
  @ApiOperation({ summary: 'Get customer profiles' })
  async getCustomerProfiles(@Query('workspaceId') workspaceId: string) {
    return this.supportService.getCustomerProfiles(workspaceId);
  }
}

import { Controller, Get, Post, Patch, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsArray } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User } from '@repo/database';
import { SupportService } from './support.service';

/**
 * THREAT MITIGATION: Input Validation & Mass Assignment Protection
 * Using explicit DTO classes with class-validator prevents arbitrary property injection
 * and ensures all body fields conform strictly to expected schema types.
 */
export class CreateTicketDto {
  @IsString()
  workspaceId: string;

  @IsString()
  subject: string;

  @IsOptional()
  @IsString()
  initialMessage?: string;
}

export class StartLiveChatDto {
  @IsString()
  workspaceId: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateTicketStatusDto {
  @IsString()
  status: string;
}

export class AssignTicketDto {
  @IsOptional()
  @IsString()
  assigneeId?: string | null;
}

export class CreateCustomerProfileDto {
  @IsString()
  workspaceId: string;

  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsOptional()
  @IsString()
  crmId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

@ApiTags('Support')
@ApiBearerAuth()
@Controller('support')
@UseGuards(AuthGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  @ApiOperation({ summary: 'Create a support ticket' })
  async createTicket(@CurrentUser() user: User, @Body() dto: CreateTicketDto) {
    return this.supportService.createTicket(dto.workspaceId, user.id, dto.subject, dto.initialMessage);
  }

  @Get('tickets')
  @ApiOperation({ summary: 'Get support tickets' })
  async getTickets(@CurrentUser() user: User, @Query('workspaceId') workspaceId: string) {
    return this.supportService.getTickets(workspaceId, user.id);
  }

  @Post('live-chat')
  @ApiOperation({ summary: 'Start a live chat session' })
  async startLiveChat(@CurrentUser() user: User, @Body() dto: StartLiveChatDto) {
    return this.supportService.startLiveChat(dto.workspaceId, user.id, dto.metadata);
  }

  /**
   * THREAT MITIGATION: BOLA/IDOR Prevention
   * Forwards CurrentUser ID to service layer to verify ownership or workspace agent permissions
   * before ending a live chat session.
   */
  @Patch('live-chat/:sessionId/end')
  @ApiOperation({ summary: 'End a live chat session' })
  async endLiveChat(@CurrentUser() user: User, @Param('sessionId') sessionId: string) {
    return this.supportService.endLiveChat(sessionId, user.id);
  }

  /**
   * THREAT MITIGATION: BOLA/IDOR Prevention
   * Forwards CurrentUser ID to service layer to verify workspace agent/owner permissions or ticket owner.
   */
  @Patch('tickets/:ticketId/status')
  @ApiOperation({ summary: 'Update ticket status' })
  async updateTicketStatus(
    @CurrentUser() user: User,
    @Param('ticketId') ticketId: string,
    @Body() dto: UpdateTicketStatusDto
  ) {
    return this.supportService.updateTicketStatus(ticketId, dto.status, user.id);
  }

  /**
   * THREAT MITIGATION: BOLA/IDOR Prevention
   * Forwards CurrentUser ID to service layer to verify the requester is an authorized workspace agent/admin/owner.
   */
  @Patch('tickets/:ticketId/assign')
  @ApiOperation({ summary: 'Assign ticket to an agent' })
  async assignTicket(
    @CurrentUser() user: User,
    @Param('ticketId') ticketId: string,
    @Body() dto: AssignTicketDto
  ) {
    return this.supportService.assignTicket(ticketId, dto.assigneeId ?? null, user.id);
  }

  /**
   * THREAT MITIGATION: BOLA/IDOR Prevention
   * Forwards CurrentUser ID to service layer to verify user is editing their own profile or is a workspace agent/admin.
   */
  @Post('customers')
  @ApiOperation({ summary: 'Create or update customer profile' })
  async createCustomerProfile(@CurrentUser() user: User, @Body() dto: CreateCustomerProfileDto) {
    return this.supportService.createCustomerProfile(dto.workspaceId, dto.userId, user.id, dto);
  }

  /**
   * THREAT MITIGATION: BOLA & PII Data Leakage Prevention
   * Forwards CurrentUser ID to service layer to ensure only authorized workspace members can view customer profiles.
   */
  @Get('customers')
  @ApiOperation({ summary: 'Get customer profiles' })
  async getCustomerProfiles(@CurrentUser() user: User, @Query('workspaceId') workspaceId: string) {
    return this.supportService.getCustomerProfiles(workspaceId, user.id);
  }
}

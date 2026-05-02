import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiProperty,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User } from '@repo/database';
import { InvitationsService } from './invitations.service';
import { z } from 'zod';

class CreateInvitationDto {
  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ required: false, example: 'member' })
  role?: string;

  @ApiProperty({ required: false, example: 'workspace_123' })
  workspaceId?: string;

  @ApiProperty({ required: false, example: 'channel_123' })
  channelId?: string;

  @ApiProperty({ required: false })
  permissions?: any;
}

const createInvitationSchema = z.object({
  email: z.string().email(),
  role: z.string().optional(),
  workspaceId: z.string().optional(),
  channelId: z.string().optional(),
  permissions: z.any().optional(),
});

@ApiTags('Invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get invitations for the current user' })
  @ApiQuery({ name: 'workspaceId', required: false, description: 'Filter by workspace ID' })
  @ApiResponse({ status: 200, description: 'List of invitations' })
  async getInvitations(@CurrentUser() user: User, @Query('workspaceId') workspaceId?: string) {
    return this.invitationsService.getInvitations(user.id, workspaceId);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Create a new invitation' })
  @ApiBody({ type: CreateInvitationDto })
  @ApiResponse({ status: 201, description: 'Invitation created successfully' })
  async createInvitation(@CurrentUser() user: User, @Body() body: CreateInvitationDto) {
    const validatedData = createInvitationSchema.parse(body);
    return this.invitationsService.createInvitation(user, {
      ...validatedData,
      email: validatedData.email, // Explicitly pass email to satisfy TS
    });
  }

  @Get(':token')
  @ApiOperation({ summary: 'Get invitation details by token' })
  @ApiParam({ name: 'token', description: 'The invitation token' })
  @ApiResponse({ status: 200, description: 'Invitation details' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async getInvitationByToken(@Param('token') token: string) {
    return this.invitationsService.getInvitationByToken(token);
  }

  @Post(':token/accept')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Accept an invitation' })
  @ApiParam({ name: 'token', description: 'The invitation token' })
  @ApiResponse({ status: 201, description: 'Invitation accepted' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async acceptInvitation(@CurrentUser() user: User, @Param('token') token: string) {
    return this.invitationsService.acceptInvitation(user, token);
  }
}

import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '@repo/database';
import { InvitationsService } from './invitations.service';
import { z } from 'zod';

const createInvitationSchema = z.object({
  email: z.string().email(),
  role: z.string().optional(),
  workspaceId: z.string().optional(),
  channelId: z.string().optional(),
  permissions: z.any().optional(),
});

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Get()
  @UseGuards(AuthGuard)
  async getInvitations(@CurrentUser() user: User, @Query('workspaceId') workspaceId?: string) {
    return this.invitationsService.getInvitations(user.id, workspaceId);
  }

  @Post()
  @UseGuards(AuthGuard)
  async createInvitation(@CurrentUser() user: User, @Body() body: any) {
    const validatedData = createInvitationSchema.parse(body);
    return this.invitationsService.createInvitation(user, {
      ...validatedData,
      email: validatedData.email, // Explicitly pass email to satisfy TS
    });
  }

  @Get(':token')
  async getInvitationByToken(@Param('token') token: string) {
    return this.invitationsService.getInvitationByToken(token);
  }

  @Post(':token/accept')
  @UseGuards(AuthGuard)
  async acceptInvitation(@CurrentUser() user: User, @Param('token') token: string) {
    return this.invitationsService.acceptInvitation(user, token);
  }
}

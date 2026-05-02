import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiProperty,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { prisma } from '@repo/database';
import type { User } from '@repo/database';
import { nanoid } from 'nanoid';

class CreateInviteLinkDto {
  @ApiProperty({ required: false, example: 0, description: 'Maximum uses, 0 for unlimited' })
  maxUses?: number;

  @ApiProperty({ required: false, description: 'Expiration date in ISO format' })
  expiresAt?: string;
}

@ApiTags('Invite Links')
@ApiBearerAuth()
@Controller('workspaces/:slug/invite-links')
@UseGuards(AuthGuard)
export class InviteLinksController {
  @Get()
  @ApiOperation({ summary: 'Get all invite links for a workspace' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiResponse({ status: 200, description: 'List of invite links' })
  async getInviteLinks(@CurrentUser() user: User, @Param('slug') slug: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const inviteLinks = await prisma.workspaceInviteLink.findMany({
      where: {
        workspaceId: workspace.id,
      },
      include: {
        createdBy: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return inviteLinks;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new invite link' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiBody({ type: CreateInviteLinkDto })
  @ApiResponse({ status: 201, description: 'Invite link created' })
  async createInviteLink(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Body() body: CreateInviteLinkDto,
  ) {
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const { maxUses, expiresAt } = body;

    const existingLink = await prisma.workspaceInviteLink.findFirst({
      where: {
        workspaceId: workspace.id,
        createdById: user.id,
      },
      include: {
        createdBy: true,
      },
    });

    if (existingLink) {
      return existingLink;
    }

    const inviteLink = await prisma.workspaceInviteLink.create({
      data: {
        workspaceId: workspace.id,
        code: nanoid(10),
        maxUses: maxUses || 0,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdById: user.id,
      },
      include: {
        createdBy: true,
      },
    });

    return inviteLink;
  }
}

import { Controller, Get, Post, Body, Param, UseGuards, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiProperty } from '@nestjs/swagger';
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
    /**
     * 3. Adds authorization: ensures the user is a member of the workspace before returning links.
     */
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      select: {
        id: true,
        members: {
          where: { userId: user.id },
          select: { role: true },
        },
        inviteLinks: {
          select: {
            id: true,
            code: true,
            maxUses: true,
            uses: true,
            expiresAt: true,
            createdAt: true,
            createdBy: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (workspace.members.length === 0) {
      throw new ForbiddenException('Access denied');
    }

    return workspace.inviteLinks;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new invite link' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiBody({ type: CreateInviteLinkDto })
  @ApiResponse({ status: 201, description: 'Invite link created' })
  async createInviteLink(@CurrentUser() user: User, @Param('slug') slug: string, @Body() body: CreateInviteLinkDto) {
        const workspace = await prisma.workspace.findUnique({
      where: { slug },
      select: {
        id: true,
        members: {
          where: { userId: user.id },
          select: { role: true },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (workspace.members.length === 0) {
      throw new ForbiddenException('Access denied');
    }

    const { maxUses, expiresAt } = body;

    const existingLink = await prisma.workspaceInviteLink.findFirst({
      where: {
        workspaceId: workspace.id,
        createdById: user.id,
      },
      select: {
        id: true,
        code: true,
        maxUses: true,
        uses: true,
        expiresAt: true,
        createdAt: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
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
      select: {
        id: true,
        code: true,
        maxUses: true,
        uses: true,
        expiresAt: true,
        createdAt: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return inviteLink;
  }
}

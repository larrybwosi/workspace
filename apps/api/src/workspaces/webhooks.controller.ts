import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiProperty } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { prisma } from '@repo/database';
import type { User } from '@repo/database';
import { z } from 'zod';
import * as crypto from 'crypto';

class CreateWorkspaceWebhookDto {
  @ApiProperty({ example: 'My Webhook' })
  name: string;

  @ApiProperty({ example: 'https://example.com/webhook' })
  url: string;

  @ApiProperty({ type: [String], example: ['message.sent', 'channel.created'] })
  events: string[];
}

class UpdateWorkspaceWebhookDto {
  @ApiProperty({ required: false, example: true })
  active?: boolean;
}

const createWebhookSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  events: z.array(z.string()),
});

const updateWebhookSchema = z.object({
  active: z.boolean().optional(),
});

@ApiTags('Webhooks')
@ApiBearerAuth()
@Controller('workspaces/:slug/webhooks')
@UseGuards(AuthGuard)
export class WebhooksController {
  @Get()
  @ApiOperation({ summary: 'Get all webhooks for a workspace' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiResponse({ status: 200, description: 'List of webhooks' })
  async getWebhooks(@CurrentUser() user: User, @Param('slug') slug: string) {
    /**
     * ⚡ Performance Optimization:
     * 1. Consolidates workspace lookup, membership verification, and webhook retrieval into a single database query.
     * 2. Reduces database round-trips from 2 down to 1.
     * 3. Adds authorization: ensures the user is a member of the workspace before returning webhooks.
     */
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      select: {
        id: true,
        members: {
          where: { userId: user.id },
          select: { role: true },
        },
        webhooks: {
          include: {
            _count: {
              select: {
                logs: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (workspace.members.length === 0) {
      throw new ForbiddenException('Forbidden');
    }

    return workspace.webhooks;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new webhook for a workspace' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiBody({ type: CreateWorkspaceWebhookDto })
  @ApiResponse({ status: 201, description: 'Webhook created successfully' })
  async createWebhook(@CurrentUser() user: User, @Param('slug') slug: string, @Body() body: CreateWorkspaceWebhookDto) {
    /**
     * ⚡ Performance Optimization:
     * 1. Consolidates workspace lookup and membership verification into a single database query.
     * 2. Reduces database round-trips from 2 down to 1.
     */
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

    const member = workspace.members[0];

    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new ForbiddenException('Forbidden');
    }

    const validatedData = createWebhookSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }
    const data = validatedData.data;

    const secret = crypto.randomBytes(32).toString('hex');

    const webhook = await prisma.workspaceWebhook.create({
      data: {
        workspaceId: workspace.id,
        name: data.name,
        url: data.url,
        secret,
        events: data.events,
      },
    });

    return webhook;
  }

  @Patch(':webhookId')
  @ApiOperation({ summary: 'Update a webhook' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'webhookId', description: 'The webhook ID' })
  @ApiBody({ type: UpdateWorkspaceWebhookDto })
  @ApiResponse({ status: 200, description: 'Webhook updated' })
  async updateWebhook(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('webhookId') webhookId: string,
    @Body() body: UpdateWorkspaceWebhookDto
  ) {
    /**
     * ⚡ Performance Optimization:
     * 1. Consolidates workspace lookup and membership verification into a single database query.
     * 2. Reduces database round-trips from 2 down to 1.
     */
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

    const member = workspace.members[0];

    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new ForbiddenException('Forbidden');
    }

    const validatedData = updateWebhookSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }
    const data = validatedData.data;

    const webhook = await prisma.workspaceWebhook.update({
      where: { id: webhookId },
      data,
    });

    return webhook;
  }

  @Delete(':webhookId')
  @ApiOperation({ summary: 'Delete a webhook' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'webhookId', description: 'The webhook ID' })
  @ApiResponse({ status: 200, description: 'Webhook deleted' })
  async deleteWebhook(@CurrentUser() user: User, @Param('slug') slug: string, @Param('webhookId') webhookId: string) {
    /**
     * ⚡ Performance Optimization:
     * 1. Consolidates workspace lookup and membership verification into a single database query.
     * 2. Reduces database round-trips from 2 down to 1.
     */
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

    const member = workspace.members[0];

    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new ForbiddenException('Forbidden');
    }

    await prisma.workspaceWebhook.delete({
      where: { id: webhookId },
    });

    return { message: 'Webhook deleted successfully' };
  }
}

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
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { prisma } from '@repo/database';
import type { User } from '@repo/database';
import { z } from 'zod';
import * as crypto from 'crypto';

const createWebhookSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  events: z.array(z.string()),
});

const updateWebhookSchema = z.object({
  active: z.boolean().optional(),
});

@Controller('workspaces/:slug/webhooks')
@UseGuards(AuthGuard)
export class WebhooksController {
  @Get()
  async getWebhooks(@CurrentUser() user: User, @Param('slug') slug: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const webhooks = await prisma.workspaceWebhook.findMany({
      where: { workspaceId: workspace.id },
      include: {
        _count: {
          select: {
            logs: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return webhooks;
  }

  @Post()
  async createWebhook(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Body() body: any,
  ) {
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
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
  async updateWebhook(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('webhookId') webhookId: string,
    @Body() body: any,
  ) {
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId: user.id } },
    });

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
  async deleteWebhook(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('webhookId') webhookId: string,
  ) {
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId: user.id } },
    });

    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new ForbiddenException('Forbidden');
    }

    await prisma.workspaceWebhook.delete({
      where: { id: webhookId },
    });

    return { message: 'Webhook deleted successfully' };
  }
}

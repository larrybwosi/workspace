import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiV2Guard } from '../../auth/api-v2.guard';
import type { ApiV2Context } from '../../auth/api-v2.guard';
import { V2Context } from '../../auth/v2-context.decorator';
import { prisma } from '@repo/database';
import { V2AuditService } from '../v2-audit.service';
import { z } from 'zod';
import * as crypto from 'crypto';

const createWebhookSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  events: z.array(z.string()),
  active: z.boolean().optional().default(true),
});

const updateWebhookSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  url: z.string().url().optional(),
  events: z.array(z.string()).optional(),
  active: z.boolean().optional(),
});

@Controller('v2/workspaces/:slug/webhooks')
@UseGuards(ApiV2Guard)
export class V2WebhooksController {
  constructor(private readonly auditService: V2AuditService) {}

  @Get()
  async getWebhooks(@V2Context() context: ApiV2Context) {
    if (!this.hasScope(context, 'webhooks:read')) {
      throw new ForbiddenException('Forbidden: Missing webhooks:read scope');
    }

    const webhooks = await prisma.workspaceWebhook.findMany({
      where: { workspaceId: context.workspaceId },
      orderBy: { createdAt: 'desc' },
    });

    await this.auditService.log(context, 'webhooks.list', 'webhook');

    return { webhooks };
  }

  @Post()
  async createWebhook(@V2Context() context: ApiV2Context, @Body() body: any) {
    if (!this.hasScope(context, 'webhooks:write')) {
      throw new ForbiddenException('Forbidden: Missing webhooks:write scope');
    }

    const validatedData = createWebhookSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }

    const data = validatedData.data;
    const secret = crypto.randomBytes(32).toString('hex');

    const webhook = await prisma.workspaceWebhook.create({
      data: {
        workspaceId: context.workspaceId!,
        name: data.name,
        url: data.url,
        events: data.events,
        active: data.active,
        secret,
      },
    });

    await this.auditService.log(
      context,
      'webhooks.create',
      'webhook',
      webhook.id,
      { name: data.name, url: data.url },
    );

    return { webhook, secret };
  }

  @Get(':webhookId')
  async getWebhook(
    @V2Context() context: ApiV2Context,
    @Param('webhookId') webhookId: string,
  ) {
    if (!this.hasScope(context, 'webhooks:read')) {
      throw new ForbiddenException('Forbidden: Missing webhooks:read scope');
    }

    const webhook = await prisma.workspaceWebhook.findUnique({
      where: { id: webhookId, workspaceId: context.workspaceId },
      include: { logs: { take: 10, orderBy: { createdAt: 'desc' } } },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    await this.auditService.log(context, 'webhooks.get', 'webhook', webhookId);

    return { webhook };
  }

  @Patch(':webhookId')
  async updateWebhook(
    @V2Context() context: ApiV2Context,
    @Param('webhookId') webhookId: string,
    @Body() body: any,
  ) {
    if (!this.hasScope(context, 'webhooks:write')) {
      throw new ForbiddenException('Forbidden: Missing webhooks:write scope');
    }

    const validatedData = updateWebhookSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }

    const data = validatedData.data;

    const webhook = await prisma.workspaceWebhook.update({
      where: { id: webhookId, workspaceId: context.workspaceId },
      data,
    });

    await this.auditService.log(
      context,
      'webhooks.update',
      'webhook',
      webhookId,
      data,
    );

    return { webhook };
  }

  @Delete(':webhookId')
  async deleteWebhook(
    @V2Context() context: ApiV2Context,
    @Param('webhookId') webhookId: string,
  ) {
    if (!this.hasScope(context, 'webhooks:write')) {
      throw new ForbiddenException('Forbidden: Missing webhooks:write scope');
    }

    const webhook = await prisma.workspaceWebhook.findUnique({
      where: { id: webhookId, workspaceId: context.workspaceId },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    await prisma.workspaceWebhook.delete({
      where: { id: webhookId },
    });

    await this.auditService.log(
      context,
      'webhooks.delete',
      'webhook',
      webhookId,
      { name: webhook.name },
    );

    return { success: true };
  }

  private hasScope(context: ApiV2Context, scope: string): boolean {
    return context.scopes.includes(scope) || context.scopes.includes('*');
  }
}

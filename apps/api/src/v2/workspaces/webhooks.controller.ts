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
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiProperty } from '@nestjs/swagger';
import { ApiV2Guard } from '../../auth/api-v2.guard';
import type { ApiV2Context } from '../../auth/api-v2.guard';
import { V2Context } from '../../auth/v2-context.decorator';
import { prisma } from '@repo/database';
import { V2AuditService } from '../v2-audit.service';
import { z } from 'zod';
import * as crypto from 'crypto';
import { IsString, IsOptional, IsArray, IsBoolean, IsUrl } from 'class-validator';

class CreateWebhookDto {
  @IsString()
  @ApiProperty({ example: 'My Webhook' })
  name: string;

  @IsUrl()
  @ApiProperty({ example: 'https://example.com/webhook' })
  url: string;

  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ example: ['message.sent', 'channel.created'] })
  events: string[];

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ default: true, required: false })
  active?: boolean;
}

class UpdateWebhookDto {
  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  name?: string;

  @IsUrl()
  @IsOptional()
  @ApiProperty({ required: false })
  url?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ApiProperty({ required: false })
  events?: string[];

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ required: false })
  active?: boolean;
}

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

@ApiTags('Webhooks')
@ApiBearerAuth()
@Controller('v2/workspaces/:slug/webhooks')
@UseGuards(ApiV2Guard)
export class V2WebhooksController {
  private readonly logger = new Logger(V2WebhooksController.name);

  constructor(private readonly auditService: V2AuditService) {}

  @Get()
  @ApiOperation({
    summary: 'List all webhooks in the workspace',
    description: `
Requires webhooks:read scope.
List all webhooks configured for this workspace.

**Supported Events:**
- \`message.sent\`: Triggered when a new message is sent.
- \`message.updated\`: Triggered when a message is edited or updated by a callback.
- \`message.action\`: Triggered when a user clicks an interactive button on a message.
- \`channel.created\`: Triggered when a new channel is created.
- \`channel.updated\`: Triggered when channel details change.
- \`member.joined\`: Triggered when a new member joins the workspace.
- \`member.left\`: Triggered when a member leaves the workspace.
    `,
  })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiResponse({ status: 200, description: 'List of webhooks returned successfully.' })
  async getWebhooks(@V2Context() context: ApiV2Context) {
    if (!this.hasScope(context, 'webhooks:read')) {
      throw new ForbiddenException('Forbidden: Missing webhooks:read scope');
    }

    const webhooks = await prisma.workspaceWebhook.findMany({
      where: { workspaceId: context.workspaceId },
      orderBy: { createdAt: 'desc' },
    });

    this.auditService.log(context, 'webhooks.list', 'webhook').catch(err => this.logger.error('Audit log error:', err));

    return { webhooks };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new webhook', description: 'Requires webhooks:write scope.' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiBody({ type: CreateWebhookDto })
  @ApiResponse({ status: 201, description: 'Webhook created successfully.' })
  async createWebhook(@V2Context() context: ApiV2Context, @Body() body: CreateWebhookDto) {
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

    this.auditService
      .log(context, 'webhooks.create', 'webhook', webhook.id, { name: data.name, url: data.url })
      .catch(err => this.logger.error('Audit log error:', err));

    return { webhook, secret };
  }

  @Get(':webhookId')
  @ApiOperation({ summary: 'Get details of a specific webhook', description: 'Requires webhooks:read scope.' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'webhookId', description: 'The webhook ID' })
  @ApiResponse({ status: 200, description: 'Webhook details returned successfully.' })
  async getWebhook(@V2Context() context: ApiV2Context, @Param('webhookId') webhookId: string) {
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

    this.auditService.log(context, 'webhooks.get', 'webhook', webhookId).catch(err => this.logger.error('Audit log error:', err));

    return { webhook };
  }

  @Patch(':webhookId')
  @ApiOperation({ summary: 'Update a webhook', description: 'Requires webhooks:write scope.' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'webhookId', description: 'The webhook ID' })
  @ApiBody({ type: UpdateWebhookDto })
  @ApiResponse({ status: 200, description: 'Webhook updated successfully.' })
  async updateWebhook(
    @V2Context() context: ApiV2Context,
    @Param('webhookId') webhookId: string,
    @Body() body: UpdateWebhookDto
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

    this.auditService.log(context, 'webhooks.update', 'webhook', webhookId, data).catch(err => this.logger.error('Audit log error:', err));

    return { webhook };
  }

  @Delete(':webhookId')
  @ApiOperation({ summary: 'Delete a webhook', description: 'Requires webhooks:write scope.' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'webhookId', description: 'The webhook ID' })
  @ApiResponse({ status: 200, description: 'Webhook deleted successfully.' })
  async deleteWebhook(@V2Context() context: ApiV2Context, @Param('webhookId') webhookId: string) {
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

    this.auditService
      .log(context, 'webhooks.delete', 'webhook', webhookId, { name: webhook.name })
      .catch(err => this.logger.error('Audit log error:', err));

    return { success: true };
  }

  private hasScope(context: ApiV2Context, scope: string): boolean {
    return context.scopes.includes(scope) || context.scopes.includes('*');
  }
}

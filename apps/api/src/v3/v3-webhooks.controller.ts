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
  Inject,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiProperty } from '@nestjs/swagger';
import { ApiV3Guard, ApiV3Context } from '../auth/api-v3.guard';
import { V3Context } from '../auth/v3-context.decorator';
import { prisma } from '@repo/database';
import { z } from 'zod';
import * as crypto from 'crypto';
import { IsString, IsOptional, IsArray, IsBoolean, IsUrl } from 'class-validator';
import Redis from 'ioredis';

export class V3CreateWebhookDto {
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

export class V3UpdateWebhookDto {
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

@ApiTags('V3 Webhooks')
@ApiBearerAuth()
@Controller('v3/workspaces/:slug/webhooks')
@UseGuards(ApiV3Guard)
export class V3WebhooksController {
  private readonly logger = new Logger(V3WebhooksController.name);

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  private formatResponse<T>(data: T) {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @ApiOperation({
    summary: 'List all webhooks in the workspace',
    description: 'Requires webhooks:read scope. Retrieves all webhooks configured for this workspace.',
  })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiResponse({ status: 200, description: 'List of webhooks returned successfully.' })
  async getWebhooks(@V3Context() context: ApiV3Context, @Param('slug') slug: string) {
    if (!context.scopes.includes('webhooks:read') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Forbidden: Missing webhooks:read scope');
    }

    if (!context.workspaceId) {
      throw new BadRequestException('Workspace ID not resolved');
    }

    const cacheKey = `v3:workspace:${context.workspaceId}:webhooks`;

    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return this.formatResponse({ webhooks: JSON.parse(cached) });
      }
    } catch (err) {
      this.logger.warn('Redis error in getWebhooks (get):', err);
    }

    const webhooks = await prisma.workspaceWebhook.findMany({
      where: { workspaceId: context.workspaceId },
      orderBy: { createdAt: 'desc' },
    });

    try {
      await this.redis.setex(cacheKey, 600, JSON.stringify(webhooks));
    } catch (err) {
      this.logger.warn('Redis error in getWebhooks (setex):', err);
    }

    return this.formatResponse({ webhooks });
  }

  @Post()
  @ApiOperation({ summary: 'Create a new webhook', description: 'Requires webhooks:write scope.' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiBody({ type: V3CreateWebhookDto })
  @ApiResponse({ status: 201, description: 'Webhook created successfully.' })
  async createWebhook(
    @V3Context() context: ApiV3Context,
    @Param('slug') slug: string,
    @Body() body: V3CreateWebhookDto
  ) {
    if (!context.scopes.includes('webhooks:write') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Forbidden: Missing webhooks:write scope');
    }

    if (!context.workspaceId) {
      throw new BadRequestException('Workspace ID not resolved');
    }

    const validatedData = createWebhookSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }

    const data = validatedData.data;
    const secret = crypto.randomBytes(32).toString('hex');

    const webhook = await prisma.workspaceWebhook.create({
      data: {
        workspaceId: context.workspaceId,
        name: data.name,
        url: data.url,
        events: data.events,
        active: data.active,
        secret,
      },
    });

    // Invalidate Cache
    const cacheKey = `v3:workspace:${context.workspaceId}:webhooks`;
    try {
      await this.redis.del(cacheKey);
    } catch (err) {
      this.logger.warn('Redis error in createWebhook (del):', err);
    }

    // Write audit log
    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId: context.workspaceId,
        userId: context.userId,
        action: 'webhook.created',
        resource: 'webhook',
        resourceId: webhook.id,
        metadata: {
          creator: context.clientId,
          name: data.name,
          url: data.url,
        } as any,
      },
    });

    return this.formatResponse({ webhook, secret });
  }

  @Get(':webhookId')
  @ApiOperation({ summary: 'Get details of a specific webhook', description: 'Requires webhooks:read scope.' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'webhookId', description: 'The webhook ID' })
  @ApiResponse({ status: 200, description: 'Webhook details returned successfully.' })
  async getWebhook(
    @V3Context() context: ApiV3Context,
    @Param('slug') slug: string,
    @Param('webhookId') webhookId: string
  ) {
    if (!context.scopes.includes('webhooks:read') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Forbidden: Missing webhooks:read scope');
    }

    if (!context.workspaceId) {
      throw new BadRequestException('Workspace ID not resolved');
    }

    const webhook = await prisma.workspaceWebhook.findUnique({
      where: { id: webhookId, workspaceId: context.workspaceId },
      include: { logs: { take: 10, orderBy: { createdAt: 'desc' } } },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    return this.formatResponse({ webhook });
  }

  @Patch(':webhookId')
  @ApiOperation({ summary: 'Update a webhook', description: 'Requires webhooks:write scope.' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'webhookId', description: 'The webhook ID' })
  @ApiBody({ type: V3UpdateWebhookDto })
  @ApiResponse({ status: 200, description: 'Webhook updated successfully.' })
  async updateWebhook(
    @V3Context() context: ApiV3Context,
    @Param('slug') slug: string,
    @Param('webhookId') webhookId: string,
    @Body() body: V3UpdateWebhookDto
  ) {
    if (!context.scopes.includes('webhooks:write') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Forbidden: Missing webhooks:write scope');
    }

    if (!context.workspaceId) {
      throw new BadRequestException('Workspace ID not resolved');
    }

    const validatedData = updateWebhookSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }

    const data = validatedData.data;

    // Check if exists first to return 404
    const existing = await prisma.workspaceWebhook.findUnique({
      where: { id: webhookId, workspaceId: context.workspaceId },
    });

    if (!existing) {
      throw new NotFoundException('Webhook not found');
    }

    const webhook = await prisma.workspaceWebhook.update({
      where: { id: webhookId, workspaceId: context.workspaceId },
      data,
    });

    // Invalidate Cache
    const cacheKey = `v3:workspace:${context.workspaceId}:webhooks`;
    try {
      await this.redis.del(cacheKey);
    } catch (err) {
      this.logger.warn('Redis error in updateWebhook (del):', err);
    }

    // Write audit log
    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId: context.workspaceId,
        userId: context.userId,
        action: 'webhook.updated',
        resource: 'webhook',
        resourceId: webhookId,
        metadata: {
          updater: context.clientId,
          changes: data,
        } as any,
      },
    });

    return this.formatResponse({ webhook });
  }

  @Delete(':webhookId')
  @ApiOperation({ summary: 'Delete a webhook', description: 'Requires webhooks:write scope.' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'webhookId', description: 'The webhook ID' })
  @ApiResponse({ status: 200, description: 'Webhook deleted successfully.' })
  async deleteWebhook(
    @V3Context() context: ApiV3Context,
    @Param('slug') slug: string,
    @Param('webhookId') webhookId: string
  ) {
    if (!context.scopes.includes('webhooks:write') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Forbidden: Missing webhooks:write scope');
    }

    if (!context.workspaceId) {
      throw new BadRequestException('Workspace ID not resolved');
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

    // Invalidate Cache
    const cacheKey = `v3:workspace:${context.workspaceId}:webhooks`;
    try {
      await this.redis.del(cacheKey);
    } catch (err) {
      this.logger.warn('Redis error in deleteWebhook (del):', err);
    }

    // Write audit log
    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId: context.workspaceId,
        userId: context.userId,
        action: 'webhook.deleted',
        resource: 'webhook',
        resourceId: webhookId,
        metadata: {
          deleter: context.clientId,
          name: webhook.name,
        } as any,
      },
    });

    return this.formatResponse({ success: true });
  }
}

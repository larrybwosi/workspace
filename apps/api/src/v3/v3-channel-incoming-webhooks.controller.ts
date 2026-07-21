import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Logger,
  UseFilters,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiProperty, ApiQuery } from '@nestjs/swagger';
import { V3ExceptionFilter } from './v3-exception.filter';
import { ApiV3Guard, ApiV3Context } from '../auth/api-v3.guard';
import { V3Context } from '../auth/v3-context.decorator';
import { prisma } from '@repo/database';
import { z } from 'zod';
import * as crypto from 'crypto';
import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { AblyChannels, AblyEvents, publishRealtime } from '@repo/shared/server';
import { V2WebhooksService } from '../v2/v2-webhooks.service';

export class CreateChannelIncomingWebhookDto {
  @IsString()
  @ApiProperty({ example: 'My Incoming Webhook' })
  name: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'Receives alerts from external monitoring system', required: false })
  description?: string;
}

export class UpdateChannelIncomingWebhookDto {
  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  name?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  description?: string;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ required: false })
  isActive?: boolean;
}

export class ExecuteChannelIncomingWebhookDto {
  @IsString()
  @ApiProperty({ example: 'Deploy successful!' })
  content: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'Deploy Bot', required: false })
  username?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'Deploy Bot', required: false })
  name?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'https://example.com/avatar.png', required: false })
  avatar_url?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'https://example.com/avatar.png', required: false })
  avatar?: string;

  @IsArray()
  @IsOptional()
  @ApiProperty({ required: false, type: 'array', items: { type: 'object' } })
  attachments?: any[];
}

const createWebhookSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

const updateWebhookSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

const executeWebhookSchema = z.object({
  content: z.string().min(1),
  username: z.string().optional(),
  name: z.string().optional(),
  avatar_url: z.string().optional(),
  avatar: z.string().optional(),
  attachments: z
    .array(
      z.object({
        name: z.string(),
        type: z.string(),
        url: z.string(),
        size: z.string().optional(),
      })
    )
    .optional(),
});

@ApiTags('V3 Channel Incoming Webhooks')
@Controller()
@UseFilters(V3ExceptionFilter)
export class V3ChannelIncomingWebhooksController {
  private readonly logger = new Logger(V3ChannelIncomingWebhooksController.name);

  constructor(private readonly webhooksService: V2WebhooksService) {}

  private formatResponse<T>(data: T) {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  private safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }

  // ============================================
  // MANAGEMENT (CRUD) ENDPOINTS
  // ============================================

  @Get('v3/workspaces/:slug/channels/:channelId/incoming-webhooks')
  @UseGuards(ApiV3Guard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List incoming webhooks for a channel',
    description: 'Requires webhooks:read scope. Retrieves all incoming webhooks configured for this channel.',
  })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'channelId', description: 'The channel ID' })
  @ApiResponse({ status: 200, description: 'List of incoming webhooks returned successfully.' })
  async getChannelWebhooks(
    @V3Context() context: ApiV3Context,
    @Param('slug') slug: string,
    @Param('channelId') channelId: string
  ) {
    if (!context.scopes.includes('webhooks:read') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Forbidden: Missing webhooks:read scope');
    }

    if (!context.workspaceId) {
      throw new BadRequestException('Workspace ID not resolved');
    }

    /**
     * ⚡ Performance Optimization:
     * 1. Consolidates channel existence/workspace verification and incoming webhooks retrieval into a single query.
     * 2. Reduces database round-trips (RTT) from 2 to 1.
     * 3. Uses 'select' to fetch only essential fields to minimize payload and memory overhead.
     */
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      select: {
        workspaceId: true,
        incomingWebhooks: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!channel || channel.workspaceId !== context.workspaceId) {
      throw new NotFoundException('Channel not found in this workspace');
    }

    return this.formatResponse({ webhooks: channel.incomingWebhooks });
  }

  @Post('v3/workspaces/:slug/channels/:channelId/incoming-webhooks')
  @UseGuards(ApiV3Guard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create an incoming webhook for a channel',
    description: 'Requires webhooks:write scope. Generates a new webhook token and secret.',
  })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'channelId', description: 'The channel ID' })
  @ApiBody({ type: CreateChannelIncomingWebhookDto })
  @ApiResponse({ status: 201, description: 'Incoming webhook created successfully.' })
  async createChannelWebhook(
    @V3Context() context: ApiV3Context,
    @Param('slug') slug: string,
    @Param('channelId') channelId: string,
    @Body() body: CreateChannelIncomingWebhookDto
  ) {
    if (!context.scopes.includes('webhooks:write') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Forbidden: Missing webhooks:write scope');
    }

    if (!context.workspaceId) {
      throw new BadRequestException('Workspace ID not resolved');
    }

    // Verify channel belongs to workspace
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      select: { id: true, workspaceId: true },
    });

    if (!channel || channel.workspaceId !== context.workspaceId) {
      throw new NotFoundException('Channel not found in this workspace');
    }

    const validatedData = createWebhookSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }

    const token = crypto.randomBytes(32).toString('hex');
    const secret = crypto.randomBytes(32).toString('hex');

    const webhook = await prisma.channelIncomingWebhook.create({
      data: {
        channelId,
        name: validatedData.data.name,
        description: validatedData.data.description,
        token,
        secret,
        createdBy: context.userId,
      },
    });

    // Write audit log
    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId: context.workspaceId,
        userId: context.userId,
        action: 'incoming_webhook.created',
        resource: 'channel_incoming_webhook',
        resourceId: webhook.id,
        metadata: {
          channelId,
          name: webhook.name,
          creator: context.clientId,
        } as any,
      },
    });

    return this.formatResponse({ webhook });
  }

  @Get('v3/workspaces/:slug/channels/:channelId/incoming-webhooks/:webhookId')
  @UseGuards(ApiV3Guard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get details of a channel incoming webhook',
    description: 'Requires webhooks:read scope.',
  })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'channelId', description: 'The channel ID' })
  @ApiParam({ name: 'webhookId', description: 'The webhook ID' })
  @ApiResponse({ status: 200, description: 'Webhook details returned successfully.' })
  async getChannelWebhook(
    @V3Context() context: ApiV3Context,
    @Param('slug') slug: string,
    @Param('channelId') channelId: string,
    @Param('webhookId') webhookId: string
  ) {
    if (!context.scopes.includes('webhooks:read') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Forbidden: Missing webhooks:read scope');
    }

    if (!context.workspaceId) {
      throw new BadRequestException('Workspace ID not resolved');
    }

    /**
     * ⚡ Performance Optimization:
     * 1. Consolidates both channel-to-workspace checks and webhook retrieval into a single database query.
     * 2. Uses nested 'select' inside 'include' to only fetch 'workspaceId' on the channel relation, reducing database RTT from 2 to 1.
     * 3. Leverages direct O(1) findUnique point lookup on the primary key `id` (webhookId) while automatically including all webhook scalar fields.
     */
    const webhook = await prisma.channelIncomingWebhook.findUnique({
      where: { id: webhookId },
      include: {
        channel: {
          select: {
            workspaceId: true,
          },
        },
        logs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!webhook || webhook.channelId !== channelId || webhook.channel?.workspaceId !== context.workspaceId) {
      throw new NotFoundException('Incoming webhook not found');
    }

    const { channel, ...webhookData } = webhook;

    return this.formatResponse({ webhook: webhookData });
  }

  @Patch('v3/workspaces/:slug/channels/:channelId/incoming-webhooks/:webhookId')
  @UseGuards(ApiV3Guard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a channel incoming webhook',
    description: 'Requires webhooks:write scope.',
  })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'channelId', description: 'The channel ID' })
  @ApiParam({ name: 'webhookId', description: 'The webhook ID' })
  @ApiBody({ type: UpdateChannelIncomingWebhookDto })
  @ApiResponse({ status: 200, description: 'Webhook updated successfully.' })
  async updateChannelWebhook(
    @V3Context() context: ApiV3Context,
    @Param('slug') slug: string,
    @Param('channelId') channelId: string,
    @Param('webhookId') webhookId: string,
    @Body() body: UpdateChannelIncomingWebhookDto
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

    /**
     * ⚡ Performance Optimization:
     * 1. Consolidates channel-to-workspace checks and webhook retrieval into a single database query.
     * 2. Reduces database round-trips (RTT) from 3 to 2 (1 verification query + 1 update mutation).
     * 3. Uses 'select' with nested properties to retrieve workspaceId of the channel for validation.
     */
    const existing = await prisma.channelIncomingWebhook.findUnique({
      where: { id: webhookId },
      select: {
        id: true,
        channelId: true,
        channel: {
          select: {
            workspaceId: true,
          },
        },
      },
    });

    if (!existing || existing.channelId !== channelId || existing.channel?.workspaceId !== context.workspaceId) {
      throw new NotFoundException('Incoming webhook not found');
    }

    const webhook = await prisma.channelIncomingWebhook.update({
      where: { id: webhookId },
      data: validatedData.data,
    });

    // Write audit log
    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId: context.workspaceId,
        userId: context.userId,
        action: 'incoming_webhook.updated',
        resource: 'channel_incoming_webhook',
        resourceId: webhookId,
        metadata: {
          channelId,
          updater: context.clientId,
          changes: validatedData.data,
        } as any,
      },
    });

    return this.formatResponse({ webhook });
  }

  @Delete('v3/workspaces/:slug/channels/:channelId/incoming-webhooks/:webhookId')
  @UseGuards(ApiV3Guard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a channel incoming webhook',
    description: 'Requires webhooks:write scope.',
  })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'channelId', description: 'The channel ID' })
  @ApiParam({ name: 'webhookId', description: 'The webhook ID' })
  @ApiResponse({ status: 200, description: 'Webhook deleted successfully.' })
  async deleteChannelWebhook(
    @V3Context() context: ApiV3Context,
    @Param('slug') slug: string,
    @Param('channelId') channelId: string,
    @Param('webhookId') webhookId: string
  ) {
    if (!context.scopes.includes('webhooks:write') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Forbidden: Missing webhooks:write scope');
    }

    if (!context.workspaceId) {
      throw new BadRequestException('Workspace ID not resolved');
    }

    /**
     * ⚡ Performance Optimization:
     * 1. Consolidates channel-to-workspace checks and webhook retrieval into a single database query.
     * 2. Reduces database round-trips (RTT) from 3 to 2 (1 verification query + 1 delete mutation).
     * 3. Uses 'select' with nested properties to retrieve workspaceId of the channel for validation.
     */
    const webhook = await prisma.channelIncomingWebhook.findUnique({
      where: { id: webhookId },
      select: {
        id: true,
        channelId: true,
        name: true,
        channel: {
          select: {
            workspaceId: true,
          },
        },
      },
    });

    if (!webhook || webhook.channelId !== channelId || webhook.channel?.workspaceId !== context.workspaceId) {
      throw new NotFoundException('Incoming webhook not found');
    }

    await prisma.channelIncomingWebhook.delete({
      where: { id: webhookId },
    });

    // Write audit log
    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId: context.workspaceId,
        userId: context.userId,
        action: 'incoming_webhook.deleted',
        resource: 'channel_incoming_webhook',
        resourceId: webhookId,
        metadata: {
          channelId,
          name: webhook.name,
          deleter: context.clientId,
        } as any,
      },
    });

    return this.formatResponse({ success: true });
  }

  // ============================================
  // EXECUTION (TRIGGER) ENDPOINTS
  // ============================================

  @Post('v3/webhooks/incoming/:token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Execute a channel incoming webhook (Token in URL)',
    description: 'Trigger a webhook using its unique token directly in the URL path. No authentication header required.',
  })
  @ApiParam({ name: 'token', description: 'The unique webhook token' })
  @ApiBody({ type: ExecuteChannelIncomingWebhookDto })
  @ApiResponse({ status: 200, description: 'Webhook message posted successfully.' })
  async executeWebhookByUrlToken(
    @Param('token') token: string,
    @Body() body: ExecuteChannelIncomingWebhookDto,
    @Headers('x-webhook-signature') signatureHeader?: string
  ) {
    const webhook = await prisma.channelIncomingWebhook.findUnique({
      where: { token },
      include: { channel: true },
    });

    if (!webhook) {
      throw new NotFoundException('Invalid webhook token');
    }

    return this.processIncomingWebhookExecution(webhook, body, signatureHeader);
  }

  @Post('v3/channels/:channelId/webhooks/incoming')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Execute a channel incoming webhook (Channel in URL)',
    description: 'Trigger a webhook targeting a specific channel ID. The webhook token must be supplied in the `x-webhook-token` header, the `token` query param, or signature query param.',
  })
  @ApiParam({ name: 'channelId', description: 'The channel ID' })
  @ApiQuery({ name: 'token', required: false, description: 'The unique webhook token (can alternatively use x-webhook-token header)' })
  @ApiBody({ type: ExecuteChannelIncomingWebhookDto })
  @ApiResponse({ status: 200, description: 'Webhook message posted successfully.' })
  async executeWebhookByChannelId(
    @Param('channelId') channelId: string,
    @Body() body: ExecuteChannelIncomingWebhookDto,
    @Headers('x-webhook-token') headerToken?: string,
    @Query('token') queryToken?: string,
    @Headers('x-webhook-signature') signatureHeader?: string
  ) {
    const token = headerToken || queryToken;
    if (!token) {
      throw new BadRequestException('Webhook token must be supplied in x-webhook-token header or token query parameter');
    }

    const webhook = await prisma.channelIncomingWebhook.findUnique({
      where: { token },
      include: { channel: true },
    });

    if (!webhook || webhook.channelId !== channelId) {
      throw new NotFoundException('Invalid webhook token or channel ID mismatch');
    }

    return this.processIncomingWebhookExecution(webhook, body, signatureHeader);
  }

  private async processIncomingWebhookExecution(
    webhook: any,
    body: ExecuteChannelIncomingWebhookDto,
    signatureHeader?: string
  ) {
    if (!webhook.isActive) {
      throw new BadRequestException('Webhook is inactive');
    }

    // Validate request body
    const validatedData = executeWebhookSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }

    // 1. Signature Verification (if header present)
    if (signatureHeader) {
      const payload = JSON.stringify(body);
      const expectedSignature = crypto.createHmac('sha256', webhook.secret).update(payload).digest('hex');
      const signatureToCompare = signatureHeader.startsWith('sha256=') ? signatureHeader.substring(7) : signatureHeader;

      if (!this.safeCompare(expectedSignature, signatureToCompare)) {
        await this.logExecution(webhook.id, body, HttpStatus.FORBIDDEN, { error: 'Invalid webhook signature' });
        throw new ForbiddenException('Invalid webhook signature');
      }
    }

    const payloadData = validatedData.data;

    // 2. Sender Representation (Retrieve Workspace System Bot or fallback to creator)
    let senderId = webhook.createdBy;
    if (webhook.channel.workspaceId) {
      const defaultBot = await prisma.botApplication.findFirst({
        where: {
          workspaceId: webhook.channel.workspaceId,
          botId: { not: null },
        },
        select: { botId: true },
      });
      if (defaultBot?.botId) {
        senderId = defaultBot.botId;
      }
    }

    // 3. Payload overrides & Metadata
    const overrideUsername = payloadData.username || payloadData.name || webhook.name;
    const overrideAvatar = payloadData.avatar_url || payloadData.avatar || null;

    const metadata = {
      isWebhook: true,
      webhookId: webhook.id,
      overrideUsername,
      overrideAvatar,
    };

    try {
      // 4. Create Message
      const message = await prisma.message.create({
        data: {
          content: payloadData.content,
          channelId: webhook.channelId,
          userId: senderId,
          messageType: 'standard',
          metadata,
          attachments: payloadData.attachments?.length
            ? {
                create: payloadData.attachments.map((a: any) => ({
                  name: a.name,
                  type: a.type,
                  url: a.url,
                  size: a.size || null,
                })),
              }
            : undefined,
        },
        include: {
          attachments: {
            select: { id: true, name: true, type: true, url: true, size: true },
          },
          user: { select: { id: true, name: true, avatar: true, image: true } },
        },
      });

      // Format sender name and avatar for display in real-time updates
      if (message.user) {
        message.user.name = overrideUsername;
        if (overrideAvatar) {
          message.user.avatar = overrideAvatar;
        }
      }

      // 5. Update Webhook Stats
      await prisma.channelIncomingWebhook.update({
        where: { id: webhook.id },
        data: {
          lastReceivedAt: new Date(),
          totalReceived: { increment: 1 },
        },
      });

      // 6. Ably & Webhook Dispatching (real-time chat + outgoing workspace webhooks)
      publishRealtime(AblyChannels.channel(webhook.channelId), AblyEvents.MESSAGE_SENT, message).catch(
        err => this.logger.error('Realtime publishing error:', err)
      );

      if (webhook.channel.workspaceId) {
        this.webhooksService.dispatch(webhook.channel.workspaceId, 'message.sent', {
          message,
        }).catch(err => this.logger.error('Webhook dispatch error:', err));
      }

      const responsePayload = { success: true, messageId: message.id };
      await this.logExecution(webhook.id, body, HttpStatus.OK, responsePayload);

      return this.formatResponse(responsePayload);
    } catch (err: any) {
      this.logger.error('Error executing channel incoming webhook:', err);
      await this.logExecution(webhook.id, body, HttpStatus.INTERNAL_SERVER_ERROR, { error: err.message });
      throw err;
    }
  }

  private async logExecution(webhookId: string, payload: any, status: number, response: any) {
    try {
      await prisma.channelIncomingWebhookLog.create({
        data: {
          webhookId,
          payload: payload as any,
          status,
          response: JSON.stringify(response),
        },
      });
    } catch (err) {
      this.logger.warn('Failed to write channel incoming webhook log:', err);
    }
  }
}

import axios from 'axios';
import * as crypto from 'crypto';
import { IsString, IsOptional, IsArray } from 'class-validator';
import { AblyChannels, publishRealtime } from '@repo/shared/server';
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
  Inject,
  Logger,
  UseFilters,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiQuery, ApiProperty } from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { V3ExceptionFilter } from './v3-exception.filter';
import { ApiV3Guard, ApiV3Context } from '../auth/api-v3.guard';
import { V3Context } from '../auth/v3-context.decorator';
import { DmsService } from '../dms/dms.service';
import { prisma } from '@repo/database';
import Redis from 'ioredis';


export class V3ActionTriggerDto {
  @IsString()
  @ApiProperty({ example: 'approve', description: 'Action identifier string' })
  actionId: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'Looks good to me!', required: false })
  comment?: string;

  @IsOptional()
  @ApiProperty({ required: false, description: 'Optional form state or payload metadata' })
  metadata?: any;
}

export class V3CreateDmDto {
  @ApiProperty({ example: 'usr_123', description: 'Target user ID to start direct message conversation with', required: false })
  targetUserId?: string;

  @ApiProperty({ example: 'usr_123', description: 'Target user ID (alias)', required: false })
  userId?: string;
}

@ApiTags('V3 Direct Messages')
@ApiBearerAuth()
@AllowAnonymous()
@Controller('v3/dms')
@UseGuards(ApiV3Guard)
@UseFilters(V3ExceptionFilter)
export class V3DmsController {
  private readonly logger = new Logger(V3DmsController.name);

  constructor(
    private readonly dmsService: DmsService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis
  ) {}

  private async resolveEffectiveUserId(context: ApiV3Context): Promise<{ id: string; name: string }> {
    if (context.userId && !context.userId.startsWith('m2m:')) {
      const u = await prisma.user.findUnique({
        where: { id: context.userId },
        select: { id: true, name: true },
      });
      if (u) return { id: u.id, name: u.name };
    }

    /**
     * ⚡ Bolt Performance Optimization:
     * Replaces `prisma.user.findFirst` on non-unique field `isBot` with a direct O(1) primary key point lookup on `id`.
     * Direct B-tree point lookup (`findUnique({ where: { id: 'system_bot_v3_m2m' } })`) avoids full table/index scans.
     * Uses `upsert` with deterministic ID `system_bot_v3_m2m` to guarantee O(1) resolution for M2M fallback context.
     */
    const systemBot = await prisma.user.upsert({
      where: { id: 'system_bot_v3_m2m' },
      update: {},
      create: {
        id: 'system_bot_v3_m2m',
        name: 'System Bot',
        email: 'system-bot-m2m@system.internal',
        isBot: true,
        status: 'online',
      },
      select: { id: true, name: true },
    });
    return { id: systemBot.id, name: systemBot.name };
  }

  private formatResponse<T>(data: T) {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @ApiOperation({
    summary: 'List direct message conversations (Enterprise M2M V3)',
    description: 'Retrieve active direct message conversations for the authenticated user/bot. Requires messages:read scope.',
  })
  @ApiResponse({ status: 200, description: 'List of DM conversations returned successfully.' })
  async getDms(@V3Context() context: ApiV3Context) {
    if (!context.scopes.includes('messages:read') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Missing messages:read scope');
    }

    const user = await this.resolveEffectiveUserId(context);
    const result = await this.dmsService.getDms(user.id);
    return this.formatResponse({ conversations: result });
  }

  @Post()
  @ApiOperation({
    summary: 'Create or retrieve a direct message conversation (Enterprise M2M V3)',
    description: 'Create a new DM conversation with a target user. Requires messages:send scope.',
  })
  @ApiBody({ type: V3CreateDmDto })
  @ApiResponse({ status: 201, description: 'Direct message conversation created or retrieved successfully.' })
  async createDm(@V3Context() context: ApiV3Context, @Body() body: V3CreateDmDto) {
    if (!context.scopes.includes('messages:send') && !context.scopes.includes('messages:write') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Missing messages:send scope');
    }

    const targetUserId = body.targetUserId || body.userId;
    if (!targetUserId) {
      throw new BadRequestException('targetUserId or userId is required');
    }

    const user = await this.resolveEffectiveUserId(context);
    const result = await this.dmsService.createDm(user.id, targetUserId, user.name);
    return this.formatResponse({ conversation: result });
  }

  @Get(':dmId')
  @ApiOperation({
    summary: 'Get details of a direct message conversation (Enterprise M2M V3)',
    description: 'Retrieve specific direct message conversation details. Requires messages:read scope.',
  })
  @ApiParam({ name: 'dmId', description: 'The direct message conversation ID' })
  @ApiResponse({ status: 200, description: 'DM conversation details returned successfully.' })
  async getDm(@V3Context() context: ApiV3Context, @Param('dmId') dmId: string) {
    if (!context.scopes.includes('messages:read') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Missing messages:read scope');
    }

    const user = await this.resolveEffectiveUserId(context);
    const result = await this.dmsService.getDm(dmId, user.id);
    if (!result) {
      throw new NotFoundException('DM conversation not found');
    }
    return this.formatResponse({ conversation: result });
  }

  @Delete(':dmId')
  @ApiOperation({
    summary: 'Delete a direct message conversation (Enterprise M2M V3)',
    description: 'Delete a direct message conversation. Requires messages:send scope.',
  })
  @ApiParam({ name: 'dmId', description: 'The direct message conversation ID' })
  @ApiResponse({ status: 200, description: 'DM conversation deleted successfully.' })
  async deleteDm(@V3Context() context: ApiV3Context, @Param('dmId') dmId: string) {
    if (!context.scopes.includes('messages:send') && !context.scopes.includes('messages:write') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Missing messages:send scope');
    }

    const user = await this.resolveEffectiveUserId(context);
    const result = await this.dmsService.deleteDm(dmId, user.id);
    return this.formatResponse(result);
  }

  @Get(':dmId/messages')
  @ApiOperation({
    summary: 'Get direct message conversation messages (Enterprise M2M V3)',
    description: 'Retrieve message history for a direct message conversation. Requires messages:read scope.',
  })
  @ApiParam({ name: 'dmId', description: 'The direct message conversation ID' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'List of direct messages returned successfully.' })
  async getMessages(
    @V3Context() context: ApiV3Context,
    @Param('dmId') dmId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limitNum = '50'
  ) {
    if (!context.scopes.includes('messages:read') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Missing messages:read scope');
    }

    const user = await this.resolveEffectiveUserId(context);
    const result = await this.dmsService.getMessages(dmId, user.id, cursor, parseInt(limitNum));
    return this.formatResponse(result);
  }

  @Post(':dmId/messages')
  @ApiOperation({
    summary: 'Send a message in a direct message conversation (Enterprise M2M V3)',
    description: 'Send a message in a DM conversation. Requires messages:send scope.',
  })
  @ApiParam({ name: 'dmId', description: 'The direct message conversation ID' })
  @ApiResponse({ status: 201, description: 'Direct message sent successfully.' })
  async createMessage(@V3Context() context: ApiV3Context, @Param('dmId') dmId: string, @Body() body: any) {
    if (!context.scopes.includes('messages:send') && !context.scopes.includes('messages:write') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Missing messages:send scope');
    }

    const user = await this.resolveEffectiveUserId(context);
    const result = await this.dmsService.createMessage(dmId, user.id, body);
    return this.formatResponse({ message: result });
  }

  @Patch(':dmId/messages/:messageId')
  @ApiOperation({
    summary: 'Update a direct message (Enterprise M2M V3)',
    description: 'Update content of a direct message. Requires messages:send scope.',
  })
  @ApiParam({ name: 'dmId', description: 'The direct message conversation ID' })
  @ApiParam({ name: 'messageId', description: 'The message ID' })
  @ApiResponse({ status: 200, description: 'Direct message updated successfully.' })
  async updateMessage(
    @V3Context() context: ApiV3Context,
    @Param('dmId') dmId: string,
    @Param('messageId') messageId: string,
    @Body() body: { content: string }
  ) {
    if (!context.scopes.includes('messages:send') && !context.scopes.includes('messages:write') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Missing messages:send scope');
    }

    const user = await this.resolveEffectiveUserId(context);
    const result = await this.dmsService.updateMessage(dmId, messageId, user.id, body.content);
    return this.formatResponse({ message: result });
  }

  @Delete(':dmId/messages/:messageId')
  @ApiOperation({
    summary: 'Delete a direct message (Enterprise M2M V3)',
    description: 'Delete a direct message. Requires messages:send scope.',
  })
  @ApiParam({ name: 'dmId', description: 'The direct message conversation ID' })
  @ApiParam({ name: 'messageId', description: 'The message ID' })
  @ApiResponse({ status: 200, description: 'Direct message deleted successfully.' })
  async deleteMessage(@V3Context() context: ApiV3Context, @Param('dmId') dmId: string, @Param('messageId') messageId: string) {
    if (!context.scopes.includes('messages:send') && !context.scopes.includes('messages:write') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Missing messages:send scope');
    }

    const user = await this.resolveEffectiveUserId(context);
    const result = await this.dmsService.deleteMessage(dmId, messageId, user.id);
    return this.formatResponse(result);
  }

  @Post(':dmId/messages/:messageId/reactions')
  @ApiOperation({
    summary: 'Add a reaction to a direct message (Enterprise M2M V3)',
    description: 'Add an emoji reaction to a DM message. Requires messages:send scope.',
  })
  @ApiParam({ name: 'dmId', description: 'The direct message conversation ID' })
  @ApiParam({ name: 'messageId', description: 'The message ID' })
  @ApiResponse({ status: 201, description: 'Reaction added successfully.' })
  async addReaction(
    @V3Context() context: ApiV3Context,
    @Param('dmId') dmId: string,
    @Param('messageId') messageId: string,
    @Body() body: { emoji: string }
  ) {
    if (!context.scopes.includes('messages:send') && !context.scopes.includes('messages:write') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Missing messages:send scope');
    }

    const user = await this.resolveEffectiveUserId(context);
    const result = await this.dmsService.addReaction(dmId, messageId, user.id, body.emoji);
    return this.formatResponse({ reaction: result });
  }

  @Delete(':dmId/messages/:messageId/reactions/:emoji')
  @ApiOperation({
    summary: 'Remove a reaction from a direct message (Enterprise M2M V3)',
    description: 'Remove an emoji reaction from a DM message. Requires messages:send scope.',
  })
  @ApiParam({ name: 'dmId', description: 'The direct message conversation ID' })
  @ApiParam({ name: 'messageId', description: 'The message ID' })
  @ApiParam({ name: 'emoji', description: 'The emoji character' })
  @ApiResponse({ status: 200, description: 'Reaction removed successfully.' })
  async removeReaction(
    @V3Context() context: ApiV3Context,
    @Param('dmId') dmId: string,
    @Param('messageId') messageId: string,
    @Param('emoji') emoji: string
  ) {
    if (!context.scopes.includes('messages:send') && !context.scopes.includes('messages:write') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Missing messages:send scope');
    }

    const user = await this.resolveEffectiveUserId(context);
    const result = await this.dmsService.removeReaction(dmId, messageId, user.id, emoji);
    return this.formatResponse(result);
  }

  @Post(':dmId/messages/:messageId/actions')
  @ApiOperation({
    summary: 'Submit response to a message action in DM (Enterprise M2M V3)',
    description: 'Trigger an action on a direct message and submit user response or form state. Dispatches callback webhooks if configured. Requires messages:send scope.',
  })
  @ApiParam({ name: 'dmId', description: 'The direct message conversation ID' })
  @ApiParam({ name: 'messageId', description: 'The message ID' })
  @ApiBody({ type: V3ActionTriggerDto })
  @ApiResponse({ status: 201, description: 'Action response recorded successfully.' })
  async triggerDmMessageAction(
    @V3Context() context: ApiV3Context,
    @Param('dmId') dmId: string,
    @Param('messageId') messageId: string,
    @Body() body: V3ActionTriggerDto
  ) {
    if (!context.scopes.includes('messages:send') && !context.scopes.includes('messages:write') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Missing messages:send scope');
    }

    const user = await this.resolveEffectiveUserId(context);
    const response = await this.processDmActionTrigger(
      dmId,
      messageId,
      user.id,
      body.actionId,
      body.comment,
      body.metadata
    );

    return this.formatResponse({ response });
  }

  @Post(':dmId/messages/:messageId/actions/:actionId')
  @ApiOperation({
    summary: 'Trigger specific DM message action by action ID (Enterprise M2M V3)',
    description: 'Trigger a specific action on a DM message by action ID in path. Dispatches callback webhooks. Requires messages:send scope.',
  })
  @ApiParam({ name: 'dmId', description: 'The direct message conversation ID' })
  @ApiParam({ name: 'messageId', description: 'The message ID' })
  @ApiParam({ name: 'actionId', description: 'The action ID string' })
  @ApiBody({ type: V3ActionTriggerDto, required: false })
  @ApiResponse({ status: 201, description: 'Action response recorded successfully.' })
  async triggerSpecificDmMessageAction(
    @V3Context() context: ApiV3Context,
    @Param('dmId') dmId: string,
    @Param('messageId') messageId: string,
    @Param('actionId') actionIdParam: string,
    @Body() body?: V3ActionTriggerDto
  ) {
    if (!context.scopes.includes('messages:send') && !context.scopes.includes('messages:write') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Missing messages:send scope');
    }

    const user = await this.resolveEffectiveUserId(context);
    const response = await this.processDmActionTrigger(
      dmId,
      messageId,
      user.id,
      actionIdParam,
      body?.comment,
      body?.metadata
    );

    return this.formatResponse({ response });
  }

  @Get(':dmId/messages/:messageId/actions')
  @ApiOperation({
    summary: 'Get responses for DM message actions (Enterprise M2M V3)',
    description: 'Retrieve all recorded user responses and form submissions for a specific DM message. Requires messages:read scope.',
  })
  @ApiParam({ name: 'dmId', description: 'The direct message conversation ID' })
  @ApiParam({ name: 'messageId', description: 'The message ID' })
  @ApiResponse({ status: 200, description: 'List of action responses returned successfully.' })
  async getDmMessageActionResponses(
    @V3Context() context: ApiV3Context,
    @Param('dmId') dmId: string,
    @Param('messageId') messageId: string
  ) {
    if (!context.scopes.includes('messages:read') && !context.scopes.includes('messages:write') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Missing messages:read scope');
    }

    const responses = await prisma.messageActionResponse.findMany({
      where: { messageId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        action: true,
      },
      orderBy: { respondedAt: 'desc' },
    });

    return this.formatResponse({ responses });
  }

  private async processDmActionTrigger(
    dmId: string,
    messageId: string,
    userId: string,
    actionIdParam: string,
    comment?: string,
    metadataPayload?: any
  ) {
    const message = (await prisma.dMMessage.findUnique({
      where: { id: messageId },
      include: {
        sender: true,
      },
    })) as any;

    if (!message || (message.dmId !== dmId && message.conversationId !== dmId)) {
      throw new NotFoundException('Message not found in this DM conversation');
    }

    const customMsgActions = (message.metadata as any)?.customMessage?.actions || (message.metadata as any)?.actions;
    let metaAct: any = null;
    if (Array.isArray(customMsgActions)) {
      metaAct = customMsgActions.find((a: any) => a.id === actionIdParam || a.actionId === actionIdParam);
    }

    let action = await prisma.messageAction.findFirst({
      where: { messageId: message.id, OR: [{ actionId: actionIdParam }, { id: actionIdParam }] },
    });

    if (!action && metaAct) {
      action = await prisma.messageAction.upsert({
        where: { messageId_actionId: { messageId: message.id, actionId: metaAct.id || metaAct.actionId } },
        update: {},
        create: {
          messageId: message.id,
          actionId: metaAct.id || metaAct.actionId,
          label: metaAct.label || metaAct.id || 'Action',
          style: (metaAct.type || metaAct.style || 'default').toLowerCase(),
          value: metaAct.value || (metaAct.handler?.payload ? JSON.stringify(metaAct.handler.payload) : undefined),
        },
      });
    }

    if (!action) {
      action = {
        id: `act_${messageId}_${actionIdParam}`,
        messageId: message.id,
        actionId: actionIdParam,
        label: metaAct?.label || actionIdParam,
        style: (metaAct?.type || 'default').toLowerCase(),
        value: metaAct?.value || null,
        disabled: false,
        order: 0,
        createdAt: new Date(),
      } as any;
    }

    const allowMultiple =
      metaAct?.allowMultipleResponses ??
      metaAct?.allowMultiple ??
      (message.metadata as any)?.allowMultipleResponses ??
      false;

    if (!allowMultiple) {
      const existingResponse = await prisma.messageActionResponse.findFirst({
        where: {
          messageId: message.id,
          userId,
          actionValue: actionIdParam,
        },
      });

      if (existingResponse) {
        throw new BadRequestException('Action already responded by this user');
      }
    }

    let callbackUrl =
      (message.metadata as any)?.callbackUrl ||
      (message.metadata as any)?.customMessage?.metadata?.callbackUrl ||
      metaAct?.handler?.url;

    if (!callbackUrl && message.sender?.isBot) {
      const app = await prisma.botApplication.findFirst({
        where: { botId: message.senderId },
        select: { interactionsUrl: true },
      });
      if (app?.interactionsUrl) {
        callbackUrl = app.interactionsUrl;
      }
    }

    let createdActionId = action.id;
    if (action.id.startsWith('act_')) {
      const dbAction = await prisma.messageAction.upsert({
        where: { messageId_actionId: { messageId: message.id, actionId: actionIdParam } },
        update: {},
        create: {
          messageId: message.id,
          actionId: actionIdParam,
          label: metaAct?.label || actionIdParam,
          style: (metaAct?.type || 'default').toLowerCase(),
        },
      });
      createdActionId = dbAction.id;
    }

    const response = await prisma.messageActionResponse.create({
      data: {
        actionId: createdActionId,
        messageId: message.id,
        userId,
        actionValue: actionIdParam,
        comment: comment || null,
        metadata: metadataPayload || {},
        webhookUrl: callbackUrl || null,
        webhookSent: false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        action: true,
      },
    });

    if (callbackUrl) {
      const webhookPayload = {
        event: 'message.action_response',
        timestamp: new Date().toISOString(),
        dmId,
        message: {
          id: message.id,
          content: message.content,
          dmId: message.dmId || dmId,
        },
        action: {
          id: actionIdParam,
          label: action.label,
        },
        response: {
          id: response.id,
          userId,
          userName: response.user?.name,
          userEmail: response.user?.email,
          actionValue: actionIdParam,
          comment,
          metadata: metadataPayload,
          respondedAt: response.respondedAt.toISOString(),
        },
      };

      const secret = process.env.WEBHOOK_SECRET || 'default_secret';
      const signature = crypto.createHmac('sha256', secret).update(JSON.stringify(webhookPayload)).digest('hex');

      axios
        .post(callbackUrl, webhookPayload, {
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Event': 'message.action_response',
            'X-Webhook-Signature': `sha256=${signature}`,
          },
          timeout: 5000,
        })
        .then(async () => {
          await prisma.messageActionResponse.update({
            where: { id: response.id },
            data: { webhookSent: true },
          });
        })
        .catch(err => this.logger.error('Failed to send DM message action callback webhook:', err));
    }

    publishRealtime(AblyChannels.dm(dmId), 'message.action_response', {
      messageId: message.id,
      actionId: actionIdParam,
      response,
    }).catch(err => this.logger.error('Failed to publish DM action response realtime event:', err));

    return response;
  }

}

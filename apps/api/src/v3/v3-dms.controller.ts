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
import * as crypto from 'crypto';

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

    // Fallback system user or bot user for M2M context
    const existingBot = await prisma.user.findFirst({
      where: { isBot: true },
      select: { id: true, name: true },
    });
    if (existingBot) return { id: existingBot.id, name: existingBot.name };

    const botId = `bot_${crypto.randomBytes(8).toString('hex')}`;
    const botUser = await prisma.user.create({
      data: {
        id: botId,
        name: `System Bot`,
        email: `system-bot-${botId}@system.internal`,
        isBot: true,
        status: 'online',
      },
    });
    return { id: botUser.id, name: botUser.name };
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

    const result = await this.dmsService.deleteDm(dmId);
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

    const result = await this.dmsService.deleteMessage(dmId, messageId);
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
}

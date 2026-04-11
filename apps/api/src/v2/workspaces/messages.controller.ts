import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Inject,
  ForbiddenException,
  Query,
  BadRequestException,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiV2Guard } from '../../auth/api-v2.guard';
import type { ApiV2Context } from '../../auth/api-v2.guard';
import { V2Context } from '../../auth/v2-context.decorator';
import { prisma } from '@repo/database';
import Redis from 'ioredis';
import { z } from 'zod';
import { V2AuditService } from '../v2-audit.service';
import { V2WebhooksService } from '../v2-webhooks.service';
import { getAblyRest, AblyChannels, AblyEvents } from '@repo/shared/server';
import { CustomMessageSchema } from '@repo/shared';
import { StorageService } from '../../common/storage/storage.service';

const createChannelSchema = z.object({
  name: z.string().min(1).max(100),
  icon: z.string().optional().default('Hash'),
  type: z.enum(['public', 'private']).optional().default('public'),
  description: z.string().max(500).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

const updateChannelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  icon: z.string().optional(),
  type: z.enum(['public', 'private']).optional(),
  description: z.string().max(500).optional(),
});

const sendMessageSchema = z
  .object({
    channelId: z.string().optional(),
    recipientId: z.string().optional(),
    content: z.string().min(1),
    threadId: z.string().optional(),
    contextId: z.string().optional(),
    messageType: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    actions: z
      .array(
        z.object({
          actionId: z.string(),
          label: z.string(),
          style: z.enum(['default', 'primary', 'danger']).optional().default('default'),
          value: z.string().optional(),
        })
      )
      .optional(),
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
  })
  .refine(data => data.channelId || data.recipientId, {
    message: 'Either channelId or recipientId must be provided',
  });

@Controller('v2/workspaces/:slug')
@UseGuards(ApiV2Guard)
export class V2MessagesController {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly auditService: V2AuditService,
    private readonly webhooksService: V2WebhooksService,
    private readonly storageService: StorageService
  ) {}

  @Get('channels')
  async getChannels(@V2Context() context: ApiV2Context) {
    if (!this.hasScope(context, 'channels:read')) {
      throw new ForbiddenException('Forbidden: Missing channels:read scope');
    }

    const cacheKey = `v2:channels:${context.workspaceId}`;
    const cachedChannels = await this.redis.get(cacheKey);

    if (cachedChannels) {
      return { channels: JSON.parse(cachedChannels), source: 'cache' };
    }

    const channels = await prisma.channel.findMany({
      where: {
        workspaceId: context.workspaceId,
      },
      include: {
        _count: {
          select: { members: true, messages: true },
        },
      },
    });

    await this.redis.setex(cacheKey, 600, JSON.stringify(channels));

    await this.auditService.log(context, 'channels.list', 'channel');

    return { channels, source: 'database' };
  }

  @Post('channels')
  async createChannel(@V2Context() context: ApiV2Context, @Body() body: any) {
    if (!this.hasScope(context, 'channels:write')) {
      throw new ForbiddenException('Forbidden: Missing channels:write scope');
    }

    const validatedData = createChannelSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }

    const { name, icon, type, description, metadata } = validatedData.data;

    const channel = await prisma.channel.create({
      data: {
        name,
        icon,
        type: type === 'private' ? 'private' : 'channel',
        isPrivate: type === 'private',
        description,
        metadata: (metadata as any) || {},
        workspaceId: context.workspaceId!,
        createdById: context.userId,
      },
    });

    await this.redis.del(`v2:channels:${context.workspaceId}`);

    await this.auditService.log(context, 'channels.create', 'channel', channel.id, {
      name,
      type,
    });

    await this.webhooksService.dispatch(context.workspaceId!, 'channel.created', {
      channel,
    });

    return { channel };
  }

  @Post('channels/:channelId/icon')
  @UseInterceptors(FileInterceptor('file'))
  async uploadChannelIcon(
    @V2Context() context: ApiV2Context,
    @Param('channelId') channelId: string,
    @UploadedFile() file: any
  ) {
    if (!this.hasScope(context, 'channels:write')) {
      throw new ForbiddenException('Forbidden: Missing channels:write scope');
    }

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const channel = await prisma.channel.findFirst({
      where: { id: channelId, workspaceId: context.workspaceId },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const asset = await this.storageService.uploadFile(file);

    const updatedChannel = await prisma.channel.update({
      where: { id: channelId },
      data: { icon: asset.url },
    });

    await this.redis.del(`v2:channels:${context.workspaceId}`);

    await this.auditService.log(context, 'channels.update_icon', 'channel', channelId, {
      url: asset.url,
    });

    return { channel: updatedChannel };
  }

  @Get('channels/:channelId')
  async getChannel(@V2Context() context: ApiV2Context, @Param('channelId') channelId: string) {
    if (!this.hasScope(context, 'channels:read')) {
      throw new ForbiddenException('Forbidden: Missing channels:read scope');
    }

    const channel = await prisma.channel.findFirst({
      where: {
        id: channelId,
        workspaceId: context.workspaceId,
      },
      include: {
        _count: {
          select: { members: true, messages: true },
        },
      },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    await this.auditService.log(context, 'channels.get', 'channel', channelId);

    return { channel };
  }

  @Patch('channels/:channelId')
  async updateChannel(@V2Context() context: ApiV2Context, @Param('channelId') channelId: string, @Body() body: any) {
    if (!this.hasScope(context, 'channels:write')) {
      throw new ForbiddenException('Forbidden: Missing channels:write scope');
    }

    const validatedData = updateChannelSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }

    const { name, icon, type, description } = validatedData.data;

    const channel = await prisma.channel.update({
      where: {
        id: channelId,
        workspaceId: context.workspaceId,
      },
      data: {
        name,
        icon,
        type: type === 'private' ? 'private' : type === 'public' ? 'channel' : undefined,
        isPrivate: type === 'private' ? true : type === 'public' ? false : undefined,
        description,
      },
    });

    await this.redis.del(`v2:channels:${context.workspaceId}`);

    await this.auditService.log(context, 'channels.update', 'channel', channelId, validatedData.data);

    return { channel };
  }

  @Delete('channels/:channelId')
  async deleteChannel(@V2Context() context: ApiV2Context, @Param('channelId') channelId: string) {
    if (!this.hasScope(context, 'channels:write')) {
      throw new ForbiddenException('Forbidden: Missing channels:write scope');
    }

    await prisma.channel.delete({
      where: {
        id: channelId,
        workspaceId: context.workspaceId,
      },
    });

    await this.redis.del(`v2:channels:${context.workspaceId}`);

    await this.auditService.log(context, 'channels.delete', 'channel', channelId);

    return { success: true };
  }

  @Get('messages')
  async getMessages(
    @V2Context() context: ApiV2Context,
    @Query('channelId') channelId?: string,
    @Query('threadId') threadId?: string,
    @Query('contextId') contextId?: string,
    @Query('limit') limitStr?: string,
    @Query('cursor') cursor?: string
  ) {
    if (!this.hasScope(context, 'messages:read')) {
      throw new ForbiddenException('Forbidden: Missing messages:read scope');
    }

    const limit = parseInt(limitStr || '50');

    let activeThreadId = threadId;

    if (contextId && !activeThreadId && channelId) {
      const thread = await prisma.thread.findFirst({
        where: {
          channelId,
          tags: { some: { tag: contextId } },
        },
      });

      if (!thread) {
        return { messages: [], nextCursor: null };
      }
      activeThreadId = thread.id;
    }

    const messages = await prisma.message.findMany({
      where: {
        channelId: channelId || undefined,
        threadId: activeThreadId || null,
        channel: { workspaceId: context.workspaceId },
      },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { timestamp: 'desc' },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        attachments: true,
        reactions: true,
        actions: true,
      },
    });

    const nextCursor = messages.length === limit ? messages[messages.length - 1].id : null;

    await this.auditService.log(context, 'messages.list', 'message', undefined, {
      channelId,
      threadId: activeThreadId,
      contextId,
    });

    return { messages: messages.reverse(), nextCursor };
  }

  @Post('messages')
  @UseInterceptors(FileInterceptor('file'))
  async sendMessage(@V2Context() context: ApiV2Context, @Body() body: any, @UploadedFile() file?: any) {
    if (!this.hasScope(context, 'messages:send')) {
      throw new ForbiddenException('Forbidden: Missing messages:send scope');
    }

    const validatedData = sendMessageSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }

    const {
      channelId,
      recipientId,
      content,
      threadId,
      contextId,
      messageType,
      metadata,
      actions,
      attachments = [],
    } = validatedData.data;

    if (file) {
      const asset = await this.storageService.uploadFile(file);
      attachments.push({
        name: asset.name,
        type: asset.type,
        url: asset.url,
        size: asset.size,
      });
    }

    // Validate custom message metadata if messageType is 'custom', 'approval', or 'report'
    if (['custom', 'approval', 'report'].includes(messageType || '')) {
      const customMessageValidation = CustomMessageSchema.safeParse(metadata);
      if (!customMessageValidation.success) {
        throw new BadRequestException({
          message: 'Invalid custom message metadata',
          errors: customMessageValidation.error.issues,
        });
      }
    }

    let createdMessage;
    let activeThreadId = threadId;

    if (channelId) {
      const channel = await prisma.channel.findFirst({
        where: { id: channelId, workspaceId: context.workspaceId },
      });

      if (!channel) throw new NotFoundException('Channel not found in this workspace');

      if (contextId && !activeThreadId) {
        const existingThread = await prisma.thread.findFirst({
          where: {
            channelId: channel.id,
            tags: { some: { tag: contextId } },
          },
        });

        if (existingThread) {
          activeThreadId = existingThread.id;
        } else {
          const newThread = await prisma.thread.create({
            data: {
              channelId: channel.id,
              creatorId: context.userId,
              tags: { create: { tag: contextId } },
            },
          });
          activeThreadId = newThread.id;
        }
      }

      createdMessage = await prisma.message.create({
        data: {
          content,
          channelId: channel.id,
          userId: context.userId,
          threadId: activeThreadId,
          messageType: messageType || 'standard',
          metadata: {
            ...((metadata as any) || {}),
            isBot: context.isBot || false,
            tokenId: context.tokenId || null,
          },
          actions: actions
            ? {
                create: actions.map((a, index) => ({
                  actionId: a.actionId,
                  label: a.label,
                  style: a.style,
                  value: a.value,
                  order: index,
                })),
              }
            : undefined,
          attachments: attachments
            ? {
                create: attachments.map(a => ({
                  name: a.name,
                  type: a.type,
                  url: a.url,
                  size: a.size,
                })),
              }
            : undefined,
        },
        include: {
          attachments: true,
          actions: true,
          user: { select: { id: true, name: true, avatar: true } },
        },
      });

      await this.auditService.log(context, 'messages.send', 'message', createdMessage.id, {
        channelId,
        threadId: activeThreadId,
      });

      const ably = getAblyRest();
      if (ably) {
        const ablyChannel = ably.channels.get(AblyChannels.channel(channelId));
        await ablyChannel.publish(AblyEvents.MESSAGE_SENT, createdMessage);
      }
    } else if (recipientId) {
      const recipientMembership = await prisma.workspaceMember.findFirst({
        where: { userId: recipientId, workspaceId: context.workspaceId },
      });

      if (!recipientMembership) {
        throw new ForbiddenException('Recipient is not a member of this workspace');
      }

      const participants = [context.userId, recipientId].sort();
      let dm = await prisma.directMessage.findUnique({
        where: {
          participant1Id_participant2Id: {
            participant1Id: participants[0],
            participant2Id: participants[1],
          },
        },
      });

      if (!dm) {
        dm = await prisma.directMessage.create({
          data: {
            participant1Id: participants[0],
            participant2Id: participants[1],
          },
        });
      }

      createdMessage = await prisma.dMMessage.create({
        data: {
          content,
          dmId: dm.id,
          senderId: context.userId,
          attachments: attachments
            ? {
                create: attachments.map(a => ({
                  name: a.name,
                  type: a.type,
                  url: a.url,
                  size: a.size,
                })),
              }
            : undefined,
        },
        include: {
          attachments: true,
          sender: { select: { id: true, name: true, avatar: true } },
        },
      });

      await prisma.directMessage.update({
        where: { id: dm.id },
        data: { lastMessageAt: new Date() },
      });

      await this.auditService.log(context, 'messages.send_dm', 'dm_message', createdMessage.id, {
        recipientId,
      });
    }

    if (createdMessage) {
      await this.webhooksService.dispatch(context.workspaceId!, 'message.sent', {
        message: createdMessage,
      });
    }

    return { message: createdMessage };
  }

  private hasScope(context: ApiV2Context, scope: string): boolean {
    return context.scopes.includes(scope) || context.scopes.includes('*');
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Inject,
  ForbiddenException,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiV2Guard } from '../../auth/api-v2.guard';
import type { ApiV2Context } from '../../auth/api-v2.guard';
import { V2Context } from '../../auth/v2-context.decorator';
import { prisma } from '@repo/database';
import Redis from 'ioredis';
import { z } from 'zod';

const createChannelSchema = z.object({
  name: z.string().min(1).max(100),
  icon: z.string().optional().default('Hash'),
  type: z.enum(['public', 'private']).optional().default('public'),
  description: z.string().max(500).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

const sendMessageSchema = z.object({
  channelId: z.string().optional(),
  recipientId: z.string().optional(),
  content: z.string().min(1),
  threadId: z.string().optional(),
  contextId: z.string().optional(),
  messageType: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  actions: z.array(z.object({
    actionId: z.string(),
    label: z.string(),
    style: z.enum(['default', 'primary', 'danger']).optional().default('default'),
    value: z.string().optional(),
  })).optional(),
  attachments: z.array(z.object({
    name: z.string(),
    type: z.string(),
    url: z.string(),
    size: z.string().optional(),
  })).optional(),
}).refine(data => data.channelId || data.recipientId, {
  message: 'Either channelId or recipientId must be provided'
});

@Controller('v2/workspaces/:slug')
@UseGuards(ApiV2Guard)
export class V2MessagesController {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

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
          select: { members: true, messages: true }
        }
      }
    });

    await this.redis.setex(cacheKey, 600, JSON.stringify(channels));

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

    return { channel };
  }

  @Get('messages')
  async getMessages(
    @V2Context() context: ApiV2Context,
    @Query('channelId') channelId?: string,
    @Query('threadId') threadId?: string,
    @Query('contextId') contextId?: string,
    @Query('limit') limitStr?: string,
    @Query('cursor') cursor?: string,
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
          tags: { some: { tag: contextId } }
        }
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
        channel: { workspaceId: context.workspaceId }
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
      }
    });

    const nextCursor = messages.length === limit ? messages[messages.length - 1].id : null;

    return { messages: messages.reverse(), nextCursor };
  }

  @Post('messages')
  async sendMessage(@V2Context() context: ApiV2Context, @Body() body: any) {
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
      attachments
    } = validatedData.data;

    let createdMessage;
    let activeThreadId = threadId;

    if (channelId) {
      const channel = await prisma.channel.findFirst({
        where: { id: channelId, workspaceId: context.workspaceId }
      });

      if (!channel) return { error: 'Channel not found in this workspace', status: 404 };

      if (contextId && !activeThreadId) {
        const existingThread = await prisma.thread.findFirst({
          where: {
            channelId: channel.id,
            tags: { some: { tag: contextId } }
          }
        });

        if (existingThread) {
          activeThreadId = existingThread.id;
        } else {
          const newThread = await prisma.thread.create({
            data: {
              channelId: channel.id,
              creatorId: context.userId,
              tags: { create: { tag: contextId } }
            }
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
            ...(metadata as any || {}),
            isBot: context.isBot || false,
            tokenId: context.tokenId || null,
          },
          actions: actions ? {
            create: actions.map((a, index) => ({
              actionId: a.actionId,
              label: a.label,
              style: a.style,
              value: a.value,
              order: index
            }))
          } : undefined,
          attachments: attachments ? {
            create: attachments.map(a => ({
              name: a.name,
              type: a.type,
              url: a.url,
              size: a.size
            }))
          } : undefined
        },
        include: {
          attachments: true,
          actions: true,
          user: { select: { id: true, name: true, avatar: true } }
        }
      });
    } else if (recipientId) {
      const recipientMembership = await prisma.workspaceMember.findFirst({
        where: { userId: recipientId, workspaceId: context.workspaceId }
      });

      if (!recipientMembership) {
        throw new ForbiddenException('Recipient is not a member of this workspace');
      }

      const participants = [context.userId, recipientId].sort();
      let dm = await prisma.directMessage.findUnique({
        where: {
          participant1Id_participant2Id: {
            participant1Id: participants[0],
            participant2Id: participants[1]
          }
        }
      });

      if (!dm) {
        dm = await prisma.directMessage.create({
          data: {
            participant1Id: participants[0],
            participant2Id: participants[1]
          }
        });
      }

      createdMessage = await prisma.dMMessage.create({
        data: {
          content,
          dmId: dm.id,
          senderId: context.userId,
          attachments: attachments ? {
            create: attachments.map(a => ({
              name: a.name,
              type: a.type,
              url: a.url,
              size: a.size
            }))
          } : undefined
        },
        include: {
          attachments: true,
          sender: { select: { id: true, name: true, avatar: true } }
        }
      });

      await prisma.directMessage.update({
        where: { id: dm.id },
        data: { lastMessageAt: new Date() }
      });
    }

    return { message: createdMessage };
  }

  private hasScope(context: ApiV2Context, scope: string): boolean {
    return context.scopes.includes(scope) || context.scopes.includes('*');
  }
}

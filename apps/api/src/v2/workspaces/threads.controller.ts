import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ApiV2Guard } from '../../auth/api-v2.guard';
import type { ApiV2Context } from '../../auth/api-v2.guard';
import { V2Context } from '../../auth/v2-context.decorator';
import { prisma } from '@repo/database';
import { V2AuditService } from '../v2-audit.service';

@Controller('v2/workspaces/:slug/threads')
@UseGuards(ApiV2Guard)
export class V2ThreadsController {
  constructor(private readonly auditService: V2AuditService) {}

  @Get()
  async getThreads(
    @V2Context() context: ApiV2Context,
    @Query('channelId') channelId?: string,
    @Query('limit') limitStr = '20',
  ) {
    if (!this.hasScope(context, 'threads:read')) {
      throw new ForbiddenException('Forbidden: Missing threads:read scope');
    }

    const limit = parseInt(limitStr);

    const threads = await prisma.thread.findMany({
      where: {
        channel: { workspaceId: context.workspaceId },
        channelId: channelId || undefined,
      },
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
        channel: { select: { id: true, name: true } },
        _count: { select: { messages: true } },
        tags: true,
        rootMessage: { select: { id: true, content: true } },
      },
    });

    await this.auditService.log(context, 'threads.list', 'thread', undefined, {
      channelId,
    });

    return { threads };
  }

  @Get(':threadId/messages')
  async getThreadMessages(
    @V2Context() context: ApiV2Context,
    @Param('threadId') threadId: string,
    @Query('limit') limitStr = '50',
    @Query('cursor') cursor?: string,
  ) {
    if (
      !this.hasScope(context, 'messages:read') ||
      !this.hasScope(context, 'threads:read')
    ) {
      throw new ForbiddenException(
        'Forbidden: Missing messages:read or threads:read scope',
      );
    }

    const limit = parseInt(limitStr);

    const messages = await prisma.message.findMany({
      where: {
        threadId,
        channel: { workspaceId: context.workspaceId },
      },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { timestamp: 'asc' },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        attachments: true,
        reactions: true,
        actions: true,
      },
    });

    const nextCursor =
      messages.length === limit ? messages[messages.length - 1].id : null;

    await this.auditService.log(context, 'threads.messages', 'thread', threadId, {
      limit,
      cursor,
    });

    return { messages, nextCursor };
  }

  @Get('context/:contextId')
  async getThreadByContext(
    @V2Context() context: ApiV2Context,
    @Param('contextId') contextId: string,
  ) {
    if (!this.hasScope(context, 'threads:read')) {
      throw new ForbiddenException('Forbidden: Missing threads:read scope');
    }

    const thread = await prisma.thread.findFirst({
      where: {
        channel: { workspaceId: context.workspaceId },
        tags: { some: { tag: contextId } },
      },
      include: {
        tags: true,
        _count: {
          select: { messages: true },
        },
      },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found for this context');
    }

    await this.auditService.log(
      context,
      'threads.get_by_context',
      'thread',
      thread.id,
      { contextId },
    );

    return { thread };
  }

  private hasScope(context: ApiV2Context, scope: string): boolean {
    return context.scopes.includes(scope) || context.scopes.includes('*');
  }
}

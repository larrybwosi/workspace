import {
  Controller,
  Get,
  Query,
  UseGuards,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ApiV2Guard } from '../../auth/api-v2.guard';
import type { ApiV2Context } from '../../auth/api-v2.guard';
import { V2Context } from '../../auth/v2-context.decorator';
import { prisma } from '@repo/database';
import { V2AuditService } from '../v2-audit.service';

@Controller('v2/workspaces/:slug/search')
@UseGuards(ApiV2Guard)
export class V2SearchController {
  constructor(private readonly auditService: V2AuditService) {}

  @Get('members')
  async searchMembers(
    @V2Context() context: ApiV2Context,
    @Query('q') query: string,
    @Query('limit') limitStr = '20',
  ) {
    if (!this.hasScope(context, 'members:read')) {
      throw new ForbiddenException('Forbidden: Missing members:read scope');
    }

    if (!query) {
      throw new BadRequestException("Search query 'q' is required");
    }

    const limit = parseInt(limitStr);

    const members = await prisma.workspaceMember.findMany({
      where: {
        workspaceId: context.workspaceId,
        user: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
      },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            status: true,
            role: true,
          },
        },
      },
    });

    await this.auditService.log(context, 'search.members', 'member', undefined, {
      query,
    });

    return { results: members.map((m) => m.user) };
  }

  @Get('messages')
  async searchMessages(
    @V2Context() context: ApiV2Context,
    @Query('q') query: string,
    @Query('channelId') channelId?: string,
    @Query('limit') limitStr = '20',
  ) {
    if (!this.hasScope(context, 'messages:read')) {
      throw new ForbiddenException('Forbidden: Missing messages:read scope');
    }

    if (!query) {
      throw new BadRequestException("Search query 'q' is required");
    }

    const limit = parseInt(limitStr);

    const messages = await prisma.message.findMany({
      where: {
        channel: { workspaceId: context.workspaceId },
        channelId: channelId || undefined,
        content: {
          contains: query,
          mode: 'insensitive',
        },
      },
      take: limit,
      orderBy: { timestamp: 'desc' },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        channel: { select: { id: true, name: true } },
        attachments: true,
        actions: true,
      },
    });

    await this.auditService.log(
      context,
      'search.messages',
      'message',
      undefined,
      { query, channelId },
    );

    return { results: messages };
  }

  private hasScope(context: ApiV2Context, scope: string): boolean {
    return context.scopes.includes(scope) || context.scopes.includes('*');
  }
}

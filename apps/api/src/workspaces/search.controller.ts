import { Controller, Get, Param, Query, UseGuards, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { prisma } from '@repo/database';
import type { User } from '@repo/database';

/**
 * Session-authenticated unified search across a workspace.
 * Powers the web command palette (Cmd+K). Scopes every query to workspaces
 * the current user is a member of, and to channels they can access.
 */
@ApiTags('Search')
@ApiBearerAuth()
@Controller('workspaces/:slug/search')
@UseGuards(AuthGuard)
export class SearchController {
  @Get()
  @ApiOperation({ summary: 'Unified workspace search (messages, channels, members, files)' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiQuery({ name: 'q', description: 'The search query' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter: all | messages | channels | members | files' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Unified search results' })
  async search(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Query('q') query = '',
    @Query('type') type: 'all' | 'messages' | 'channels' | 'members' | 'files' = 'all',
    @Query('limit') limitStr = '8'
  ) {
    const q = (query || '').trim();
    const limit = Math.min(Math.max(parseInt(limitStr, 10) || 8, 1), 25);

    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      select: {
        id: true,
        members: { where: { userId: user.id }, select: { id: true } },
      },
    });

    if (!workspace) throw new NotFoundException('Workspace not found');
    if (workspace.members.length === 0) throw new ForbiddenException('Not a member of this workspace');

    const workspaceId = workspace.id;

    // Channels the user can read (public, or private channels they belong to)
    const accessibleChannelFilter = {
      workspaceId,
      OR: [{ isPrivate: false }, { isPrivate: true, members: { some: { userId: user.id } } }],
    };

    if (!q) {
      return { query: q, results: { channels: [], members: [], messages: [], files: [] } };
    }

    const wants = (t: typeof type) => type === 'all' || type === t;

    const [channels, members, messages, files] = await Promise.all([
      wants('channels')
        ? prisma.channel.findMany({
            where: {
              ...accessibleChannelFilter,
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
              ],
            },
            take: limit,
            select: { id: true, name: true, slug: true, icon: true, type: true, isPrivate: true, description: true },
          })
        : Promise.resolve([]),

      wants('members')
        ? prisma.user.findMany({
            where: {
              workspaceMemberships: { some: { workspaceId } },
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
              ],
            },
            take: limit,
            select: { id: true, name: true, email: true, avatar: true, status: true, role: true },
          })
        : Promise.resolve([]),

      wants('messages')
        ? prisma.message.findMany({
            where: {
              channel: accessibleChannelFilter,
              content: { contains: q, mode: 'insensitive' },
            },
            take: limit,
            orderBy: { timestamp: 'desc' },
            select: {
              id: true,
              content: true,
              timestamp: true,
              channelId: true,
              threadId: true,
              user: { select: { id: true, name: true, avatar: true } },
              channel: { select: { id: true, name: true, slug: true } },
            },
          })
        : Promise.resolve([]),

      wants('files')
        ? prisma.attachment.findMany({
            where: {
              name: { contains: q, mode: 'insensitive' },
              message: { channel: accessibleChannelFilter },
            },
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              name: true,
              type: true,
              url: true,
              size: true,
              createdAt: true,
              message: {
                select: { id: true, channelId: true, channel: { select: { id: true, name: true, slug: true } } },
              },
            },
          })
        : Promise.resolve([]),
    ]);

    return { query: q, results: { channels, members, messages, files } };
  }
}

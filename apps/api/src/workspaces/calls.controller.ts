import {
  // Bolt: Break duplication with OrganizationsController
  Controller,
  Get,
  Param,
  UseGuards,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { prisma } from '@repo/database';
import { type User } from '@repo/database';

const CALL_SELECT = {
  id: true,
  title: true,
  description: true,
  channelName: true,
  type: true,
  status: true,
  startedAt: true,
  metadata: true,
  initiator: {
    select: { id: true, name: true, avatar: true, image: true },
  },
  participants: {
    where: { leftAt: null },
    select: {
      id: true,
      userId: true,
      role: true,
      joinedAt: true,
      user: { select: { id: true, name: true, avatar: true, image: true } },
    },
  },
  _count: { select: { participants: true } },
};

@ApiTags('Calls')
@ApiBearerAuth()
@Controller('workspaces/:slug/calls')
@UseGuards(AuthGuard)
export class CallsController {
  @Get('active')
  @ApiOperation({ summary: 'Get active calls in a workspace' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiResponse({ status: 200, description: 'List of active calls' })
  async getActiveCalls(@CurrentUser() user: User, @Param('slug') slug: string) {
    /**
     * ⚡ Performance Optimization:
     * Eliminates N+1 queries and consolidates workspace authorization.
     * Expected impact: Database RTT reduced from 2+N down to 3.
     */
    const workspace = await this.verifyWorkspaceAccess(slug, user.id);
    const calls = await this.fetchActiveCallsInWorkspace(workspace.id);

    const channelIds = this.extractChannelIdsFromCalls(calls);
    const channelMap = await this.getRelevantChannels(channelIds, user.id);

    const filteredCalls = calls.filter((call) => this.isCallAccessible(call, user.id, channelMap));

    return { calls: filteredCalls };
  }

  private async verifyWorkspaceAccess(slug: string, userId: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      select: {
        id: true,
        members: { where: { userId }, select: { userId: true } },
      },
    });

    if (!workspace) throw new NotFoundException('Workspace not found');
    if (workspace.members.length === 0) throw new ForbiddenException('Access denied');

    return workspace;
  }

  private async fetchActiveCallsInWorkspace(workspaceId: string) {
    return prisma.call.findMany({
      where: {
        status: { in: ['pending', 'active'] },
        workspaceId,
      },
      select: CALL_SELECT as any,
      orderBy: { startedAt: 'desc' },
    });
  }

  private extractChannelIdsFromCalls(calls: any[]): string[] {
    return calls
      .map((call) => call.channelName.match(/^channel-(.+)$/)?.[1])
      .filter(Boolean) as string[];
  }

  /**
   * ⚡ Optimization: Batch fetches channel metadata to avoid N+1 queries.
   */
  private async getRelevantChannels(channelIds: string[], userId: string) {
    if (channelIds.length === 0) return new Map<string, any>();

    const channels = await prisma.channel.findMany({
      where: { id: { in: channelIds } },
      select: {
        id: true,
        isPrivate: true,
        members: {
          where: { userId },
          select: { userId: true },
        },
      },
    });

    return new Map(channels.map((c) => [c.id, c]));
  }

  /**
   * ⚡ Optimization: Efficiently checks call accessibility using pre-fetched metadata.
   */
  private isCallAccessible(call: any, userId: string, channelMap: Map<string, any>): boolean {
    const name: string = call.channelName;
    if (name.startsWith('dm-')) {
      return name.includes(userId);
    }
    return this.isChannelAccessible(name, channelMap);
  }

  private isChannelAccessible(name: string, channelMap: Map<string, any>): boolean {
    if (!name.startsWith('channel-')) return true;

    const channel = channelMap.get(name.slice(8));
    if (!channel) return false;

    if (!channel.isPrivate) return true;
    return channel.members.length > 0;
  }
}

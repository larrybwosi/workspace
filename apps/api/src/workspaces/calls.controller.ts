import {
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
import type { User } from '@repo/database';

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
     * 1. Consolidates workspace lookup and membership verification into a single query.
     * 2. Eliminates N+1 query problem by batch-fetching all relevant channels in one round-trip.
     * 3. Uses targeted 'select' to reduce data payload from the database.
     * Expected impact: Reduces database round-trips from 2+N down to 3, significantly
     * speeding up retrieval in workspaces with multiple active calls.
     */
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      select: {
        id: true,
        members: {
          where: { userId: user.id },
          select: { userId: true },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (workspace.members.length === 0) {
      throw new ForbiddenException('Access denied');
    }

    const calls = await prisma.call.findMany({
      where: {
        status: { in: ['pending', 'active'] },
        metadata: {
          path: ['workspaceId'],
          equals: workspace.id,
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        channelName: true,
        type: true,
        status: true,
        startedAt: true,
        metadata: true,
        initiator: {
          select: {
            id: true,
            name: true,
            avatar: true,
            image: true,
          },
        },
        participants: {
          where: { leftAt: null },
          select: {
            id: true,
            userId: true,
            role: true,
            joinedAt: true,
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: { participants: true },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    // ⚡ Batch fetch all channels to avoid N+1 queries in the loop
    const channelIds = calls
      .map((call) => call.channelName.match(/^channel-(.+)$/)?.[1])
      .filter(Boolean) as string[];

    const channelData =
      channelIds.length > 0
        ? await prisma.channel.findMany({
            where: { id: { in: channelIds } },
            select: {
              id: true,
              isPrivate: true,
              members: {
                where: { userId: user.id },
                select: { userId: true },
              },
            },
          })
        : [];

    const channelMap = new Map(channelData.map((c) => [c.id, c]));

    const filteredCalls = calls.filter((call) => {
      const channelIdMatch = call.channelName.match(/^channel-(.+)$/);
      if (channelIdMatch) {
        const channelId = channelIdMatch[1];
        const channel = channelMap.get(channelId);

        // If channel not found or private and user not a member, skip
        if (!channel || (channel.isPrivate && channel.members.length === 0)) {
          return false;
        }
      }

      if (call.channelName.startsWith('dm-')) {
        const isParticipant = call.channelName.includes(user.id);
        if (!isParticipant) return false;
      }

      return true;
    });

    return { calls: filteredCalls };
  }
}

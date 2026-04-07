import {
  Controller,
  Get,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { prisma } from '@repo/database';
import type { User } from '@repo/database';

@Controller('workspaces/:slug/calls')
@UseGuards(AuthGuard)
export class CallsController {
  @Get('active')
  async getActiveCalls(@CurrentUser() user: User, @Param('slug') slug: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const calls = await prisma.call.findMany({
      where: {
        status: { in: ['pending', 'active'] },
        metadata: {
          path: ['workspaceId'],
          equals: workspace.id,
        },
      },
      include: {
        initiator: true,
        _count: {
          select: { participants: true },
        },
        participants: {
          where: { leftAt: null },
          include: { user: true },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    const filteredCalls = [];
    for (const call of calls) {
      const channelIdMatch = call.channelName.match(/^channel-(.+)$/);
      if (channelIdMatch) {
        const channelId = channelIdMatch[1];
        const channel = await prisma.channel.findUnique({
          where: { id: channelId },
          select: { isPrivate: true, members: { where: { userId: user.id } } },
        });

        if (channel?.isPrivate && channel.members.length === 0) {
          continue;
        }
      }

      if (call.channelName.startsWith('dm-')) {
        const isParticipant = call.channelName.includes(user.id);
        if (!isParticipant) continue;
      }

      filteredCalls.push(call);
    }

    return { calls: filteredCalls };
  }
}

import { Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { prisma, type User } from '@repo/database';
import { getAblyRest } from '@repo/shared/server';

@Controller('ably')
@UseGuards(AuthGuard)
export class AblyController {
  @Post('token')
  async getToken(@CurrentUser() user: User) {
    const client = getAblyRest();
    if (!client) {
      throw new Error('Ably client not initialized');
    }

    // Fetch user's workspaces and channels to provide granular capabilities
    const [workspaces, channelMemberships] = await Promise.all([
      prisma.workspaceMember.findMany({
        where: { userId: user.id },
        select: { workspaceId: true },
      }),
      prisma.channelMember.findMany({
        where: { userId: user.id },
        select: { channelId: true },
      }),
    ]);

    const workspaceIds = workspaces.map(w => w.workspaceId);
    const channelIds = channelMemberships.map(cm => cm.channelId);

    const capability: Record<string, string[]> = {
      [`user:${user.id}:*`]: ['subscribe', 'publish', 'history', 'presence'],
      [`notifications:${user.id}:*`]: ['subscribe', 'publish', 'history', 'presence'],
      'session:*': ['subscribe', 'publish', 'history', 'presence'],
      'presence:*': ['subscribe', 'publish', 'history', 'presence'],
      'dm:*': ['subscribe', 'publish', 'history', 'presence'],
    };

    // Granular workspace capabilities
    for (const workspaceId of workspaceIds) {
      capability[`workspace:${workspaceId}:*`] = ['subscribe', 'publish', 'history', 'presence'];
    }

    // Granular channel capabilities
    for (const channelId of channelIds) {
      capability[`channel:${channelId}:*`] = ['subscribe', 'publish', 'history', 'presence'];
      capability[`thread:${channelId}:*`] = ['subscribe', 'publish', 'history', 'presence'];
      capability[`call-chat:${channelId}:*`] = ['subscribe', 'publish', 'history', 'presence'];
    }

    const tokenRequest = await client.auth.createTokenRequest({
      clientId: user.id,
      capability,
      ttl: 3600 * 1000, // 1 hour in milliseconds
      timestamp: Date.now(),
    });

    return tokenRequest;
  }
}

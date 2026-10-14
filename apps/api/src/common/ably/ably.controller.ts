import { Controller, Post, Req } from '@nestjs/common';
import { auth } from '@repo/auth';
import { getAblyRest } from '@repo/shared/server';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { prisma } from '@repo/database';

@Controller('ably')
export class AblyController {
  @Post('token')
  @AllowAnonymous()
  async getToken(@Req() request: any) {
    const headers = this.normalize(request.headers);
    this.inject(headers);

    const session = await auth.api.getSession({ headers });
    const user = session?.user;

    const client = getAblyRest();
    if (!client) {
      throw new Error('Ably client not initialized');
    }

    if (user) {
      /**
       * THREAT MITIGATION: Broken Object Level Authorization (BOLA/Realtime IDOR)
       * Instead of granting blanket wildcards ('channel:*', 'workspace:*', 'dm:*'),
       * query the database for resources the user is explicitly authorized to access:
       * 1. Workspaces the user belongs to.
       * 2. Channels the user belongs to + public channels in member workspaces.
       * 3. DM conversations where the user is a participant.
       * Dynamically grant Ably token capabilities only for authorized channel names.
       */
      const [workspaceMemberships, channelMemberships, dmConversations] = await Promise.all([
        prisma.workspaceMember.findMany({
          where: { userId: user.id },
          select: { workspaceId: true },
        }),
        prisma.channelMember.findMany({
          where: { userId: user.id },
          select: { channelId: true },
        }),
        prisma.directMessage.findMany({
          where: {
            OR: [{ participant1Id: user.id }, { participant2Id: user.id }],
          },
          select: { id: true },
        }),
      ]);

      const workspaceIds = workspaceMemberships.map(m => m.workspaceId);

      const publicChannels = workspaceIds.length
        ? await prisma.channel.findMany({
            where: {
              workspaceId: { in: workspaceIds },
              isPrivate: false,
            },
            select: { id: true },
          })
        : [];

      const channelIdSet = new Set<string>([
        ...channelMemberships.map(m => m.channelId),
        ...publicChannels.map(c => c.id),
      ]);

      const ops = ['subscribe', 'publish', 'history', 'presence'];

      const capability: Record<string, string[]> = {
        [`user:${user.id}:*`]: ops,
        [`notifications:${user.id}:*`]: ops,
        'global-presence': ['subscribe', 'publish', 'presence'],
      };

      for (const wId of workspaceIds) {
        capability[`workspace:${wId}`] = ops;
      }

      for (const cId of channelIdSet) {
        capability[`channel:${cId}`] = ops;
        capability[`thread:${cId}`] = ops;
        capability[`presence:${cId}`] = ops;
      }

      for (const dm of dmConversations) {
        capability[`dm:${dm.id}`] = ops;
      }

      const tokenRequest = await client.auth.createTokenRequest({
        clientId: user.id,
        capability,
        ttl: 3600 * 1000, // 1 hour in milliseconds
        timestamp: Date.now(),
      });

      return tokenRequest;
    } else {
      // Unauthenticated client (guest) - allow access ONLY to qr-session:*
      const tokenRequest = await client.auth.createTokenRequest({
        clientId: 'anonymous:guest',
        capability: {
          'qr-session:*': ['subscribe'],
        },
        ttl: 3600 * 1000, // 1 hour in milliseconds
        timestamp: Date.now(),
      });

      return tokenRequest;
    }
  }

  private normalize(raw: Record<string, any>): Record<string, string> {
    const headers: Record<string, string> = {};
    Object.keys(raw).forEach(k => {
      headers[k] = Array.isArray(raw[k]) ? raw[k].join(', ') : String(raw[k] ?? '');
    });
    return headers;
  }

  private inject(headers: Record<string, string>): void {
    const h = headers.authorization || headers.Authorization || '';
    if (!h.startsWith('Bearer ')) return;
    const t = h.split(' ')[1];
    if (!t) return;

    const keys = [
      'better-auth.session_token',
      'better-auth.session-token',
      '__Secure-better-auth.session_token',
      '__Secure-better-auth.session-token',
    ];

    let cookie = headers.cookie || '';
    for (const k of keys) {
      if (!cookie.includes(k)) {
        cookie = cookie ? `${cookie}; ${k}=${t}` : `${k}=${t}`;
      }
    }
    headers.cookie = cookie;
  }
}

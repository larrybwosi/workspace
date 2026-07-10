import { Controller, Post, Req } from '@nestjs/common';
import { auth } from '@repo/auth';
import { getAblyRest } from '@repo/shared/server';

@Controller('ably')
export class AblyController {
  @Post('token')
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
      // TODO: More granular capabilities based on user's workspaces and channels
      const tokenRequest = await client.auth.createTokenRequest({
        clientId: user.id,
        capability: {
          [`user:${user.id}:*`]: ['subscribe', 'publish', 'history', 'presence'],
          [`notifications:${user.id}:*`]: ['subscribe', 'publish', 'history', 'presence'],
          'channel:*': ['subscribe', 'publish', 'history', 'presence'],
          'session:*': ['subscribe', 'publish', 'history', 'presence'],
          'workspace:*': ['subscribe', 'publish', 'history', 'presence'],
          'thread:*': ['subscribe', 'publish', 'history', 'presence'],
          'call:*': ['subscribe', 'publish', 'history', 'presence'],
          'call-chat:*': ['subscribe', 'publish', 'history', 'presence'],
          'dm:*': ['subscribe', 'publish', 'history', 'presence'],
          'presence:*': ['subscribe', 'publish', 'history', 'presence'],
        },
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
    const k = 'better-auth.session_token';
    if (!t || (headers.cookie && headers.cookie.includes(k))) return;
    headers.cookie = headers.cookie ? `${headers.cookie}; ${k}=${t}` : `${k}=${t}`;
  }
}

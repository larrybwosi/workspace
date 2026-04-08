import { Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import type { User } from '@repo/database';
import { getAblyRest } from '@repo/shared';

@Controller('ably')
@UseGuards(AuthGuard)
export class AblyController {
  @Post('token')
  async getToken(@CurrentUser() user: User) {
    const client = getAblyRest();
    if (!client) {
      throw new Error('Ably client not initialized');
    }

    const tokenRequest = await client.auth.createTokenRequest({
      clientId: user.id,
      capability: {
        'channel:*': ['subscribe', 'publish', 'history', 'presence'],
        'session:*': ['subscribe', 'publish', 'history', 'presence'],
        'workspace:*': ['subscribe', 'publish', 'history', 'presence'],
        'user:*': ['subscribe', 'publish', 'history', 'presence'],
        'notifications:*': ['subscribe', 'publish', 'history', 'presence'],
        'thread:*': ['subscribe', 'publish', 'history', 'presence'],
        'call-chat:*': ['subscribe', 'publish', 'history', 'presence'],
        'dm:*': ['subscribe', 'publish', 'history', 'presence'],
        'presence:*': ['subscribe', 'publish', 'history', 'presence'],
      },
      ttl: 3600 * 1000, // 1 hour in milliseconds
      timestamp: Date.now(),
    });

    return tokenRequest;
  }
}

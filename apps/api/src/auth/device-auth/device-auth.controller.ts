import { Controller, Post, Get, Body, UseGuards, Param, Inject, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '../auth.guard';
import { CurrentUser } from '../current-user.decorator';
import { nanoid } from 'nanoid';
import Redis from 'ioredis';
import { auth } from '../better-auth';
import { publishToAbly } from '@repo/shared/server';

@Controller('auth/device')
export class DeviceAuthController {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  @Post('qr/generate')
  async generateQR() {
    const sessionId = nanoid();
    const key = `qr-session:${sessionId}`;

    await this.redis.set(key, JSON.stringify({ status: 'pending' }), 'EX', 120);

    return { sessionId };
  }

  @Get('qr/status/:sessionId')
  async checkStatus(@Param('sessionId') sessionId: string) {
    const key = `qr-session:${sessionId}`;
    const data = await this.redis.get(key);

    if (!data) return { status: 'expired' };

    return JSON.parse(data);
  }

  @Post('qr/authorize')
  @UseGuards(AuthGuard)
  async authorize(@Body() body: { sessionId: string }, @CurrentUser() user: any) {
    const key = `qr-session:${body.sessionId}`;
    const data = await this.redis.get(key);

    if (!data) throw new NotFoundException('Session not found or expired');
    const sessionData = JSON.parse(data);

    // Create a new session for the user via Better-Auth
    // We use the auth.api.createSession which is part of Better-Auth's internal API
    const newSession = await auth.api.createSession({
        body: {
            userId: user.id,
        }
    });

    if (!newSession) {
        throw new UnauthorizedException('Could not create session');
    }

    const payload = {
      status: 'authorized',
      userId: user.id,
      token: newSession.token,
      session: newSession
    };

    await this.redis.set(key, JSON.stringify(payload), 'EX', 120);

    // Notify desktop client via Ably for instant update
    try {
        await publishToAbly(`qr-session:${body.sessionId}`, 'authorized', payload);
    } catch (e) {
        console.error('Failed to publish Ably notification for QR auth', e);
    }

    return { success: true };
  }
}

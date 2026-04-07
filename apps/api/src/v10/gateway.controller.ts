import { Controller, Get, Post, Body, UseGuards, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { ApiV10Guard } from '../auth/api-v10.guard';
import { ConfigService } from '@nestjs/config';
import { prisma } from '@repo/database';
import * as crypto from 'crypto';
import * as Ably from 'ably';

@Controller('v10/gateway')
export class V10GatewayController {
  constructor(private readonly configService: ConfigService) {}

  @Get('bot')
  @UseGuards(ApiV10Guard)
  async getBotGateway() {
    const gatewayUrl = this.configService.get<string>('DISCORD_GATEWAY_URL') || 'ws://localhost:3001/api/v10/gateway';

    return {
      url: gatewayUrl,
      shards: 1,
      session_start_limit: {
        total: 1000,
        remaining: 999,
        reset_after: 14400000,
        max_concurrency: 1,
      },
    };
  }

  @Post('auth')
  async botAuth(@Body('token') token: string) {
    const userId = this.validateBotToken(token);

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    const bot = await prisma.user.findFirst({
      where: { id: userId, isBot: true, botToken: token },
    });

    if (!bot) {
      throw new UnauthorizedException('Unauthorized');
    }

    try {
      const ablyKey = this.configService.get<string>('ABLY_API_KEY');
      if (!ablyKey) {
        throw new InternalServerErrorException('ABLY_API_KEY is not defined');
      }

      const ably = new Ably.Rest({ key: ablyKey });
      const tokenRequest = await ably.auth.requestToken({
        clientId: bot.id,
        capability: JSON.stringify({
          'channel:*': ['subscribe', 'publish', 'history', 'presence'],
          'workspace:*': ['subscribe', 'publish', 'history', 'presence'],
          'user:*': ['subscribe', 'publish', 'history', 'presence'],
          'notifications:*': ['subscribe', 'publish', 'history', 'presence'],
          'presence:*': ['subscribe', 'publish', 'history', 'presence'],
        }),
        ttl: 3600 * 1000,
      });
      return tokenRequest;
    } catch (error) {
      console.error('Error creating bot Ably token request:', error);
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  private validateBotToken(token: string): string | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const [base64Id, timestamp, signature] = parts;

      const expectedSignature = crypto
        .createHmac('sha256', process.env.BOT_TOKEN_SECRET || 'default_secret')
        .update(`${base64Id}.${timestamp}`)
        .digest('base64url');

      if (signature !== expectedSignature) return null;

      const userId = Buffer.from(base64Id, 'base64').toString('utf-8');
      return userId;
    } catch (error) {
      return null;
    }
  }
}

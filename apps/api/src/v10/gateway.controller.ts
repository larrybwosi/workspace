import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ApiV10Guard } from '../auth/api-v10.guard';
import { ConfigService } from '@nestjs/config';
import { prisma } from '@repo/database';
import * as crypto from 'crypto';
import * as Ably from 'ably';

@Controller('bot/v10/gateway')
export class V10GatewayController {
  private readonly logger = new Logger(V10GatewayController.name);

  constructor(private readonly configService: ConfigService) {}

  @Get('bot')
  @UseGuards(ApiV10Guard)
  async getBotGateway() {
    const gatewayUrl = this.configService.get<string>('DISCORD_GATEWAY_URL') || 'ws://localhost:3000/v10/gateway';

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

    // ⚡ Performance Optimization:
    // Leverages direct O(1) primary key lookup on 'id' instead of slower 'findFirst' table/index scan,
    // handling additional property checks in application logic.
    const bot = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!bot || !bot.isBot || bot.botToken !== token) {
      throw new UnauthorizedException('Unauthorized');
    }

    try {
      const ablyKey = this.configService.get<string>('ABLY_API_KEY');
      if (!ablyKey) {
        throw new InternalServerErrorException('ABLY_API_KEY is not defined');
      }

      /**
       * THREAT MITIGATION: Broken Object Level Authorization (BOLA / Realtime IDOR)
       * Instead of issuing blanket wildcard capabilities ('channel:*', 'workspace:*', 'dm:*'),
       * query the database for resources the bot is explicitly authorized to access:
       * 1. Workspaces the bot belongs to.
       * 2. Direct channel memberships + public channels in member workspaces.
       * Dynamically scope Ably token capabilities to prevent unauthorized cross-tenant realtime eavesdropping.
       */
      const [workspaceMemberships, channelMemberships] = await Promise.all([
        prisma.workspaceMember.findMany({
          where: { userId: bot.id },
          select: { workspaceId: true },
        }),
        prisma.channelMember.findMany({
          where: { userId: bot.id },
          select: { channelId: true },
        }),
      ]);

      const workspaceIds = workspaceMemberships.map((m) => m.workspaceId);

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
        ...channelMemberships.map((m) => m.channelId),
        ...publicChannels.map((c) => c.id),
      ]);

      const ops = ['subscribe', 'publish', 'history', 'presence'];

      const capability: Record<string, string[]> = {
        [`user:${bot.id}:*`]: ops,
      };

      for (const wId of workspaceIds) {
        capability[`workspace:${wId}`] = ops;
      }

      for (const cId of channelIdSet) {
        capability[`channel:${cId}`] = ops;
        capability[`thread:${cId}`] = ops;
        capability[`presence:${cId}`] = ops;
      }

      const ably = new Ably.Rest({ key: ablyKey });
      const tokenRequest = await ably.auth.requestToken({
        clientId: bot.id,
        capability: JSON.stringify(capability),
        ttl: 3600 * 1000,
      });
      return tokenRequest;
    } catch (error) {
      this.logger.error('Error creating bot Ably token request:', error);
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  private validateBotToken(token: string): string | null {
    try {
      if (!token || typeof token !== 'string') return null;
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const [base64Id, timestamp, signature] = parts;

      const expectedSignature = crypto
        .createHmac('sha256', process.env.BOT_TOKEN_SECRET || 'change-me-to-a-random-secret')
        .update(`${base64Id}.${timestamp}`)
        .digest('base64url');

      /**
       * THREAT MITIGATION: Timing Side-Channel Attack
       * Use constant-time buffer comparison (crypto.timingSafeEqual) rather than standard string equality
       * to prevent attackers from inferring HMAC signature bytes via response timing differences.
       */
      const sigBuffer = Buffer.from(signature);
      const expectedBuffer = Buffer.from(expectedSignature);

      if (
        sigBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
      ) {
        return null;
      }

      const userId = Buffer.from(base64Id, 'base64').toString('utf-8');
      return userId;
    } catch (error) {
      return null;
    }
  }
}

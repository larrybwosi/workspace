import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { V10GatewayController } from './gateway.controller';
import { prisma } from '@repo/database';
import * as crypto from 'crypto';

vi.mock('@repo/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    workspaceMember: {
      findMany: vi.fn(),
    },
    channelMember: {
      findMany: vi.fn(),
    },
    channel: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('ably', () => {
  function MockRest() {
    return {
      auth: {
        requestToken: vi.fn().mockImplementation((opts: any) => Promise.resolve(opts)),
      },
    };
  }
  return {
    Rest: MockRest,
    default: { Rest: MockRest },
  };
});

describe('V10GatewayController', () => {
  let controller: V10GatewayController;
  let configService: ConfigService;

  const mockSecret = 'test-secret';
  process.env.BOT_TOKEN_SECRET = mockSecret;

  function createValidToken(botId: string): string {
    const base64Id = Buffer.from(botId).toString('base64');
    const timestamp = '1700000000';
    const signature = crypto
      .createHmac('sha256', mockSecret)
      .update(`${base64Id}.${timestamp}`)
      .digest('base64url');
    return `${base64Id}.${timestamp}.${signature}`;
  }

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [V10GatewayController],
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn((key: string) => {
              if (key === 'DISCORD_GATEWAY_URL') return 'ws://localhost:3000/v10/gateway';
              if (key === 'ABLY_API_KEY') return 'test-ably-key:secret';
              return null;
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<V10GatewayController>(V10GatewayController);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getBotGateway', () => {
    it('should return gateway connection metadata', async () => {
      const result = await controller.getBotGateway();
      expect(result).toEqual({
        url: 'ws://localhost:3000/v10/gateway',
        shards: 1,
        session_start_limit: {
          total: 1000,
          remaining: 999,
          reset_after: 14400000,
          max_concurrency: 1,
        },
      });
    });
  });

  describe('botAuth', () => {
    it('should throw UnauthorizedException if token is invalid or malformed', async () => {
      await expect(controller.botAuth('invalid.token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if token signature mismatch', async () => {
      const token = 'bot_id.1700000000.invalidsignature';
      await expect(controller.botAuth(token)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if bot user is not found or not marked as isBot', async () => {
      const botId = 'bot_123';
      const token = createValidToken(botId);

      (prisma.user.findUnique as any).mockResolvedValue(null);

      await expect(controller.botAuth(token)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw InternalServerErrorException if ABLY_API_KEY is not configured', async () => {
      const botId = 'bot_123';
      const token = createValidToken(botId);

      (prisma.user.findUnique as any).mockResolvedValue({
        id: botId,
        isBot: true,
        botToken: token,
      });

      vi.spyOn(configService, 'get').mockReturnValue(null as any);

      await expect(controller.botAuth(token)).rejects.toThrow(InternalServerErrorException);
    });

    it('should return scoped Ably capabilities matching bot workspace and channel memberships', async () => {
      const botId = 'bot_123';
      const token = createValidToken(botId);

      (prisma.user.findUnique as any).mockResolvedValue({
        id: botId,
        isBot: true,
        botToken: token,
      });

      (prisma.workspaceMember.findMany as any).mockResolvedValue([
        { workspaceId: 'ws_1' },
      ]);
      (prisma.channelMember.findMany as any).mockResolvedValue([
        { channelId: 'ch_private' },
      ]);
      (prisma.channel.findMany as any).mockResolvedValue([
        { id: 'ch_public' },
      ]);

      const result = await controller.botAuth(token);

      expect(result.clientId).toBe(botId);

      const capability = JSON.parse(result.capability);

      expect(capability).toEqual({
        'user:bot_123:*': ['subscribe', 'publish', 'history', 'presence'],
        'workspace:ws_1': ['subscribe', 'publish', 'history', 'presence'],
        'channel:ch_private': ['subscribe', 'publish', 'history', 'presence'],
        'thread:ch_private': ['subscribe', 'publish', 'history', 'presence'],
        'presence:ch_private': ['subscribe', 'publish', 'history', 'presence'],
        'channel:ch_public': ['subscribe', 'publish', 'history', 'presence'],
        'thread:ch_public': ['subscribe', 'publish', 'history', 'presence'],
        'presence:ch_public': ['subscribe', 'publish', 'history', 'presence'],
      });

      // Ensure no blanket wildcards are issued
      expect(capability).not.toHaveProperty('channel:*');
      expect(capability).not.toHaveProperty('workspace:*');
      expect(capability).not.toHaveProperty('dm:*');
    });
  });
});

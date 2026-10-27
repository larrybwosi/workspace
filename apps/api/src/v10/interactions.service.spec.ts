import { Test, TestingModule } from '@nestjs/testing';
import { V10InteractionsService } from './interactions.service';
import { UnauthorizedException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { prisma } from '@repo/database';
import * as sharedServer from '@repo/shared/server';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import * as crypto from 'crypto';

vi.mock('@repo/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    channel: {
      findUnique: vi.fn(),
    },
    workspaceMember: {
      findUnique: vi.fn(),
    },
    message: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@repo/shared/server', () => ({
  AblyChannels: {
    channel: vi.fn((id) => `channel:${id}`),
  },
  AblyEvents: {
    MESSAGE_SENT: 'message:sent',
    MESSAGE_UPDATED: 'message:updated',
  },
  publishRealtime: vi.fn().mockResolvedValue(undefined),
}));

describe('V10InteractionsService', () => {
  let service: V10InteractionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [V10InteractionsService],
    }).compile();

    service = module.get<V10InteractionsService>(V10InteractionsService);
    vi.clearAllMocks();
  });

  describe('handleCallback', () => {
    const botId = 'bot-123';
    const interactionId = 'int-456';
    const timestamp = Date.now().toString();
    const clientSecret = 'test-secret-key';

    const generateValidToken = () => {
      const payload = `${botId}.${interactionId}.${timestamp}`;
      const sig = crypto.createHmac('sha256', clientSecret).update(payload).digest('hex');
      return `${botId}.${interactionId}.${timestamp}.${sig}`;
    };

    it('should throw UnauthorizedException when signature is invalid (timing-safe check)', async () => {
      const validToken = generateValidToken();
      const tamperedToken = validToken.slice(0, -4) + '0000';

      (prisma.user.findUnique as any).mockResolvedValue({
        id: botId,
        isBot: true,
        botApplication: { clientSecret },
      });

      await expect(
        service.handleCallback(interactionId, tamperedToken, { type: 4, data: { channel_id: 'chan-1', content: 'hi' } })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException if channel does not exist (BOLA protection)', async () => {
      const token = generateValidToken();

      (prisma.user.findUnique as any).mockResolvedValue({
        id: botId,
        isBot: true,
        botApplication: { clientSecret },
      });

      (prisma.channel.findUnique as any).mockResolvedValue(null);

      await expect(
        service.handleCallback(interactionId, token, { type: 4, data: { channel_id: 'chan-missing', content: 'hi' } })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if bot is not a member of the channel workspace (BOLA protection)', async () => {
      const token = generateValidToken();

      (prisma.user.findUnique as any).mockResolvedValue({
        id: botId,
        isBot: true,
        botApplication: { clientSecret },
      });

      (prisma.channel.findUnique as any).mockResolvedValue({
        id: 'chan-1',
        workspaceId: 'ws-unauthorized',
        workspace: { members: [] },
      });

      await expect(
        service.handleCallback(interactionId, token, { type: 4, data: { channel_id: 'chan-1', content: 'hi' } })
      ).rejects.toThrow(ForbiddenException);
    });

    it('should create message and publish realtime event when bot is a member of the workspace', async () => {
      const token = generateValidToken();

      (prisma.user.findUnique as any).mockResolvedValue({
        id: botId,
        name: 'TestBot',
        avatar: null,
        isBot: true,
        botApplication: { clientSecret },
      });

      (prisma.channel.findUnique as any).mockResolvedValue({
        id: 'chan-1',
        workspaceId: 'ws-1',
        workspace: { members: [{ id: 'wm-1' }] },
      });

      (prisma.message.create as any).mockResolvedValue({
        id: 'msg-100',
        content: 'Hello world',
        channelId: 'chan-1',
        userId: botId,
        flags: 0,
      });

      const result = await service.handleCallback(interactionId, token, {
        type: 4,
        data: { channel_id: 'chan-1', content: 'Hello world' },
      });

      expect(result).toBeNull();
      expect(prisma.message.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          content: 'Hello world',
          userId: botId,
          channelId: 'chan-1',
        }),
      });
      expect(sharedServer.publishRealtime).toHaveBeenCalledWith(
        'channel:chan-1',
        'message:sent',
        expect.objectContaining({
          message: expect.objectContaining({ id: 'msg-100' }),
        })
      );
    });
  });
});

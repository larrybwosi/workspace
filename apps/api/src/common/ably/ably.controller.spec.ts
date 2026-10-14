import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AblyController } from './ably.controller';
import { auth } from '@repo/auth';
import { getAblyRest } from '@repo/shared/server';
import { prisma } from '@repo/database';

vi.mock('@repo/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock('@repo/shared/server', () => ({
  getAblyRest: vi.fn(),
}));

vi.mock('@repo/database', () => ({
  prisma: {
    workspaceMember: {
      findMany: vi.fn(),
    },
    channelMember: {
      findMany: vi.fn(),
    },
    directMessage: {
      findMany: vi.fn(),
    },
    channel: {
      findMany: vi.fn(),
    },
  },
}));

describe('AblyController', () => {
  let controller: AblyController;
  let mockAblyClient: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockAblyClient = {
      auth: {
        createTokenRequest: vi.fn().mockImplementation((opts: any) => Promise.resolve(opts)),
      },
    };

    (getAblyRest as any).mockReturnValue(mockAblyClient);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AblyController],
    }).compile();

    controller = module.get<AblyController>(AblyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getToken', () => {
    it('should return guest token request with qr-session capability for unauthenticated users', async () => {
      (auth.api.getSession as any).mockResolvedValue(null);

      const result = await controller.getToken({ headers: {} });

      expect(mockAblyClient.auth.createTokenRequest).toHaveBeenCalledWith({
        clientId: 'anonymous:guest',
        capability: {
          'qr-session:*': ['subscribe'],
        },
        ttl: 3600 * 1000,
        timestamp: expect.any(Number),
      });
      expect(result.clientId).toBe('anonymous:guest');
    });

    it('should return scoped capabilities for authenticated users based on their memberships', async () => {
      const mockUser = { id: 'user-123', name: 'Test User' };
      (auth.api.getSession as any).mockResolvedValue({ user: mockUser });

      (prisma.workspaceMember.findMany as any).mockResolvedValue([
        { workspaceId: 'ws-1' },
      ]);
      (prisma.channelMember.findMany as any).mockResolvedValue([
        { channelId: 'ch-private-1' },
      ]);
      (prisma.directMessage.findMany as any).mockResolvedValue([
        { id: 'dm-1' },
      ]);
      (prisma.channel.findMany as any).mockResolvedValue([
        { id: 'ch-public-1' },
      ]);

      const result = await controller.getToken({ headers: {} });

      expect(mockAblyClient.auth.createTokenRequest).toHaveBeenCalledWith({
        clientId: 'user-123',
        capability: {
          'user:user-123:*': ['subscribe', 'publish', 'history', 'presence'],
          'notifications:user-123:*': ['subscribe', 'publish', 'history', 'presence'],
          'global-presence': ['subscribe', 'publish', 'presence'],
          'workspace:ws-1': ['subscribe', 'publish', 'history', 'presence'],
          'channel:ch-private-1': ['subscribe', 'publish', 'history', 'presence'],
          'thread:ch-private-1': ['subscribe', 'publish', 'history', 'presence'],
          'presence:ch-private-1': ['subscribe', 'publish', 'history', 'presence'],
          'channel:ch-public-1': ['subscribe', 'publish', 'history', 'presence'],
          'thread:ch-public-1': ['subscribe', 'publish', 'history', 'presence'],
          'presence:ch-public-1': ['subscribe', 'publish', 'history', 'presence'],
          'dm:dm-1': ['subscribe', 'publish', 'history', 'presence'],
        },
        ttl: 3600 * 1000,
        timestamp: expect.any(Number),
      });

      // Ensure blanket wildcards like channel:* or workspace:* or dm:* are NOT present
      const capability = result.capability;
      expect(capability).not.toHaveProperty('channel:*');
      expect(capability).not.toHaveProperty('workspace:*');
      expect(capability).not.toHaveProperty('dm:*');
    });

    it('should throw an error if Ably client is not initialized', async () => {
      (getAblyRest as any).mockReturnValue(null);

      await expect(controller.getToken({ headers: {} })).rejects.toThrow(
        'Ably client not initialized'
      );
    });
  });
});

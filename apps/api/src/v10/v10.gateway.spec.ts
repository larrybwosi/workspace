import { Test, TestingModule } from '@nestjs/testing';
import { V10Gateway } from './v10.gateway';
import { prisma } from '@repo/database';
import { ConfigService } from '@nestjs/config';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@repo/database', () => ({
  prisma: {
    channel: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

describe('V10Gateway', () => {
  let gateway: V10Gateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        V10Gateway,
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn().mockReturnValue(null),
          },
        },
      ],
    }).compile();

    gateway = module.get<V10Gateway>(V10Gateway);
    vi.clearAllMocks();
  });

  describe('dispatchMessageCreated', () => {
    it('should use single-query nested workspace selection and dispatch to bot members', async () => {
      const mockChannel = {
        workspaceId: 'ws1',
        workspace: {
          members: [{ userId: 'bot1' }, { userId: 'sender1' }],
        },
      };
      (prisma.channel.findUnique as any).mockResolvedValue(mockChannel);
      const dispatchSpy = vi.spyOn(gateway, 'dispatch').mockImplementation(() => {});

      const messagePayload = {
        id: 'msg1',
        channelId: 'chan1',
        userId: 'sender1',
        content: 'Hello world',
        timestamp: new Date().toISOString(),
        user: { name: 'Sender', avatar: 'avatar.png', isBot: false },
      };

      await (gateway as any).dispatchMessageCreated(messagePayload);

      expect(prisma.channel.findUnique).toHaveBeenCalledWith({
        where: { id: 'chan1' },
        select: {
          workspaceId: true,
          workspace: {
            select: {
              members: {
                where: { user: { isBot: true } },
                select: { userId: true },
              },
            },
          },
        },
      });

      expect(dispatchSpy).toHaveBeenCalledTimes(1);
      expect(dispatchSpy).toHaveBeenCalledWith('bot1', 'MESSAGE_CREATE', expect.objectContaining({
        id: 'msg1',
        channel_id: 'chan1',
        guild_id: 'ws1',
        content: 'Hello world',
      }));
    });

    it('should handle channels with no workspaceId gracefully', async () => {
      (prisma.channel.findUnique as any).mockResolvedValue(null);
      const dispatchSpy = vi.spyOn(gateway, 'dispatch').mockImplementation(() => {});

      await (gateway as any).dispatchMessageCreated({ id: 'msg1', channelId: 'chan1' });

      expect(prisma.channel.findUnique).toHaveBeenCalled();
      expect(dispatchSpy).not.toHaveBeenCalled();
    });
  });

  describe('dispatchMessageUpdated', () => {
    it('should use single-query nested workspace selection and dispatch to bot members', async () => {
      const mockChannel = {
        workspaceId: 'ws1',
        workspace: {
          members: [{ userId: 'bot1' }],
        },
      };
      (prisma.channel.findUnique as any).mockResolvedValue(mockChannel);
      const dispatchSpy = vi.spyOn(gateway, 'dispatch').mockImplementation(() => {});

      const messagePayload = {
        id: 'msg1',
        channelId: 'chan1',
        userId: 'user1',
        content: 'Updated content',
        timestamp: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await (gateway as any).dispatchMessageUpdated(messagePayload);

      expect(prisma.channel.findUnique).toHaveBeenCalledWith({
        where: { id: 'chan1' },
        select: {
          workspaceId: true,
          workspace: {
            select: {
              members: {
                where: { user: { isBot: true } },
                select: { userId: true },
              },
            },
          },
        },
      });

      expect(dispatchSpy).toHaveBeenCalledWith('bot1', 'MESSAGE_UPDATE', expect.objectContaining({
        id: 'msg1',
        channel_id: 'chan1',
        guild_id: 'ws1',
        content: 'Updated content',
      }));
    });
  });

  describe('dispatchMessageDeleted', () => {
    it('should use single-query nested workspace selection and dispatch deletion to bot members', async () => {
      const mockChannel = {
        workspaceId: 'ws1',
        workspace: {
          members: [{ userId: 'bot1' }, { userId: 'bot2' }],
        },
      };
      (prisma.channel.findUnique as any).mockResolvedValue(mockChannel);
      const dispatchSpy = vi.spyOn(gateway, 'dispatch').mockImplementation(() => {});

      await (gateway as any).dispatchMessageDeleted({ id: 'msg1', channelId: 'chan1' });

      expect(prisma.channel.findUnique).toHaveBeenCalledWith({
        where: { id: 'chan1' },
        select: {
          workspaceId: true,
          workspace: {
            select: {
              members: {
                where: { user: { isBot: true } },
                select: { userId: true },
              },
            },
          },
        },
      });

      expect(dispatchSpy).toHaveBeenCalledTimes(2);
      expect(dispatchSpy).toHaveBeenCalledWith('bot1', 'MESSAGE_DELETE', {
        id: 'msg1',
        channel_id: 'chan1',
        guild_id: 'ws1',
      });
      expect(dispatchSpy).toHaveBeenCalledWith('bot2', 'MESSAGE_DELETE', {
        id: 'msg1',
        channel_id: 'chan1',
        guild_id: 'ws1',
      });
    });
  });
});

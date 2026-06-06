import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { DmsService } from './dms.service';

// Mock @repo/database
vi.mock('@repo/database', () => ({
  prisma: {
    directMessage: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    dMMessage: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    dMMessageRead: {
      createMany: vi.fn(),
      upsert: vi.fn(),
    },
    dMReaction: {
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

// Mock @repo/shared/server
vi.mock('@repo/shared/server', () => ({
  getAblyRest: vi.fn(),
  AblyChannels: {
    user: vi.fn((id: string) => `user:${id}`),
    channel: vi.fn((id: string) => `channel:${id}`),
    dm: vi.fn((id: string) => `dm:${id}`),
  },
  AblyEvents: {
    MESSAGE_SENT: 'message.sent',
    MESSAGE_UPDATED: 'message.updated',
    MESSAGE_DELETED: 'message.deleted',
    MESSAGE_READ: 'message.read',
  },
  publishToAbly: vi.fn().mockResolvedValue(undefined),
}));

import { prisma } from '@repo/database';
import { getAblyRest } from '@repo/shared/server';

describe('DmsService', () => {
  let service: DmsService;
  const mockPrisma = prisma as any;
  const mockGetAblyRest = getAblyRest as any;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [DmsService],
    }).compile();

    service = module.get<DmsService>(DmsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('markAsRead - batch createMany optimization (PR change)', () => {
    it('should return success early when messageIds is empty', async () => {
      const result = await service.markAsRead('user-1', []);

      expect(result).toEqual({ success: true });
      expect(mockPrisma.dMMessageRead.createMany).not.toHaveBeenCalled();
    });

    it('should use createMany instead of sequential upserts', async () => {
      mockPrisma.dMMessageRead.createMany.mockResolvedValue({ count: 3 });
      mockPrisma.dMMessage.findUnique.mockResolvedValue({ id: 'dm-msg-1', dmId: 'dm-1' });
      mockGetAblyRest.mockReturnValue(null);

      await service.markAsRead('user-1', ['dm-msg-1', 'dm-msg-2', 'dm-msg-3']);

      expect(mockPrisma.dMMessageRead.createMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.dMMessageRead.upsert).not.toHaveBeenCalled();
    });

    it('should call createMany with correct data for all messageIds', async () => {
      mockPrisma.dMMessageRead.createMany.mockResolvedValue({ count: 2 });
      mockPrisma.dMMessage.findUnique.mockResolvedValue({ id: 'msg-1', dmId: 'dm-1' });
      mockGetAblyRest.mockReturnValue(null);

      await service.markAsRead('user-42', ['msg-1', 'msg-2']);

      expect(mockPrisma.dMMessageRead.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ messageId: 'msg-1', userId: 'user-42' }),
            expect.objectContaining({ messageId: 'msg-2', userId: 'user-42' }),
          ]),
          skipDuplicates: true,
        })
      );
    });

    it('should use skipDuplicates: true to handle already-read messages', async () => {
      mockPrisma.dMMessageRead.createMany.mockResolvedValue({ count: 0 });
      mockPrisma.dMMessage.findUnique.mockResolvedValue({ id: 'msg-1', dmId: 'dm-1' });
      mockGetAblyRest.mockReturnValue(null);

      await service.markAsRead('user-1', ['msg-1']);

      const callArg = mockPrisma.dMMessageRead.createMany.mock.calls[0][0];
      expect(callArg.skipDuplicates).toBe(true);
    });

    it('should include readAt timestamp in createMany data', async () => {
      mockPrisma.dMMessageRead.createMany.mockResolvedValue({ count: 1 });
      mockPrisma.dMMessage.findUnique.mockResolvedValue({ id: 'msg-1', dmId: 'dm-1' });
      mockGetAblyRest.mockReturnValue(null);

      await service.markAsRead('user-1', ['msg-1']);

      const callArg = mockPrisma.dMMessageRead.createMany.mock.calls[0][0];
      expect(callArg.data[0]).toHaveProperty('readAt');
      expect(callArg.data[0].readAt).toBeInstanceOf(Date);
    });
  });

  describe('markAsRead - Ably notification (PR change)', () => {
    it('should publish MESSAGE_READ to user Ably channel when ably is available', async () => {
      mockPrisma.dMMessageRead.createMany.mockResolvedValue({ count: 1 });
      mockPrisma.dMMessage.findUnique.mockResolvedValue({
        id: 'dm-msg-1',
        dmId: 'dm-conversation-1',
      });

      const mockPublish = vi.fn().mockResolvedValue(undefined);
      const mockChannel = { publish: mockPublish };
      mockGetAblyRest.mockReturnValue({
        channels: { get: vi.fn().mockReturnValue(mockChannel) },
      });

      const result = await service.markAsRead('user-1', ['dm-msg-1', 'dm-msg-2']);

      expect(mockPublish).toHaveBeenCalledWith(
        'message.read',
        expect.objectContaining({
          dmId: 'dm-conversation-1',
          messageIds: ['dm-msg-1', 'dm-msg-2'],
        })
      );
      expect(result).toEqual({ success: true });
    });

    it('should publish to the user personal channel (user:userId)', async () => {
      mockPrisma.dMMessageRead.createMany.mockResolvedValue({ count: 1 });
      mockPrisma.dMMessage.findUnique.mockResolvedValue({
        id: 'dm-msg-1',
        dmId: 'dm-conv-1',
      });

      const mockChannelGet = vi.fn().mockReturnValue({
        publish: vi.fn().mockResolvedValue(undefined),
      });
      mockGetAblyRest.mockReturnValue({
        channels: { get: mockChannelGet },
      });

      await service.markAsRead('user-42', ['dm-msg-1']);

      // Should publish to user channel, not dm channel
      expect(mockChannelGet).toHaveBeenCalledWith('user:user-42');
    });

    it('should NOT publish when Ably is unavailable (null)', async () => {
      mockPrisma.dMMessageRead.createMany.mockResolvedValue({ count: 1 });
      mockPrisma.dMMessage.findUnique.mockResolvedValue({
        id: 'dm-msg-1',
        dmId: 'dm-conv-1',
      });
      mockGetAblyRest.mockReturnValue(null);

      const result = await service.markAsRead('user-1', ['dm-msg-1']);

      expect(result).toEqual({ success: true });
    });

    it('should NOT publish when firstMessage is not found', async () => {
      mockPrisma.dMMessageRead.createMany.mockResolvedValue({ count: 0 });
      mockPrisma.dMMessage.findUnique.mockResolvedValue(null);

      const mockPublish = vi.fn();
      mockGetAblyRest.mockReturnValue({
        channels: { get: vi.fn().mockReturnValue({ publish: mockPublish }) },
      });

      const result = await service.markAsRead('user-1', ['nonexistent-msg']);

      expect(mockPublish).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('should look up dmId from the first message in the array', async () => {
      mockPrisma.dMMessageRead.createMany.mockResolvedValue({ count: 3 });
      mockPrisma.dMMessage.findUnique.mockResolvedValue({
        id: 'first-msg',
        dmId: 'dm-from-first-message',
      });

      const mockPublish = vi.fn().mockResolvedValue(undefined);
      mockGetAblyRest.mockReturnValue({
        channels: { get: vi.fn().mockReturnValue({ publish: mockPublish }) },
      });

      await service.markAsRead('user-1', ['first-msg', 'second-msg', 'third-msg']);

      expect(mockPrisma.dMMessage.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'first-msg' },
          select: { dmId: true },
        })
      );

      expect(mockPublish).toHaveBeenCalledWith(
        'message.read',
        expect.objectContaining({ dmId: 'dm-from-first-message' })
      );
    });

    it('should include all messageIds in the Ably notification payload', async () => {
      const messageIds = ['msg-1', 'msg-2', 'msg-3'];
      mockPrisma.dMMessageRead.createMany.mockResolvedValue({ count: 3 });
      mockPrisma.dMMessage.findUnique.mockResolvedValue({ id: 'msg-1', dmId: 'dm-conv-1' });

      const mockPublish = vi.fn().mockResolvedValue(undefined);
      mockGetAblyRest.mockReturnValue({
        channels: { get: vi.fn().mockReturnValue({ publish: mockPublish }) },
      });

      await service.markAsRead('user-1', messageIds);

      expect(mockPublish).toHaveBeenCalledWith('message.read', expect.objectContaining({ messageIds }));
    });

    it('should return success true regardless of Ably availability', async () => {
      mockPrisma.dMMessageRead.createMany.mockResolvedValue({ count: 1 });
      mockPrisma.dMMessage.findUnique.mockResolvedValue({ id: 'msg-1', dmId: 'dm-1' });

      const mockPublish = vi.fn().mockResolvedValue(undefined);
      mockGetAblyRest.mockReturnValue({
        channels: { get: vi.fn().mockReturnValue({ publish: mockPublish }) },
      });

      const result = await service.markAsRead('user-1', ['msg-1']);
      expect(result).toEqual({ success: true });
    });
  });

  describe('createMessage - consolidated update optimization (PR change)', () => {
    it('should consolidate message creation and DM update into a single prisma.directMessage.update call', async () => {
      const mockDm = {
        messages: [
          {
            id: 'msg-1',
            dmId: 'dm-1',
            senderId: 'user-1',
            content: 'Hello',
            createdAt: new Date(),
            sender: { id: 'user-1', name: 'User 1', avatar: 'avatar.png' },
            attachments: [],
            replyToId: 'reply-1',
          },
        ],
      };
      mockPrisma.directMessage.update.mockResolvedValue(mockDm);
      mockGetAblyRest.mockReturnValue(null);

      const result = await service.createMessage('dm-1', 'user-1', { content: 'Hello' });

      expect(mockPrisma.directMessage.update).toHaveBeenCalledTimes(1);
      expect(mockPrisma.dMMessage.create).not.toHaveBeenCalled();
      expect(mockPrisma.directMessage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'dm-1' },
          data: expect.objectContaining({
            lastMessageAt: expect.any(Date),
            messages: expect.objectContaining({
              create: expect.objectContaining({
                content: 'Hello',
                senderId: 'user-1',
              }),
            }),
          }),
        })
      );
      expect(result.id).toBe('msg-1');
    });

    it('should correctly format the response from the nested message', async () => {
      const now = new Date();
      const mockDm = {
        messages: [
          {
            id: 'msg-1',
            dmId: 'dm-1',
            senderId: 'user-1',
            content: 'Hello',
            createdAt: now,
            sender: { id: 'user-1', name: 'User 1', avatar: 'avatar.png' },
            attachments: [],
            reactions: [],
          },
        ],
      };
      mockPrisma.directMessage.update.mockResolvedValue(mockDm);
      mockGetAblyRest.mockReturnValue(null);

      const result = await service.createMessage('dm-1', 'user-1', { content: 'Hello' });

      expect(result).toEqual(
        expect.objectContaining({
          id: 'msg-1',
          content: 'Hello',
          userId: 'user-1',
          user: expect.objectContaining({ id: 'user-1', name: 'User 1' }),
          timestamp: now,
          messageType: 'standard',
        })
      );
    });

    it('should preserve replyToId in the nested include', async () => {
      const mockDm = {
        messages: [
          {
            id: 'msg-1',
            sender: {},
            attachments: [],
            createdAt: new Date(),
            replyToId: 'parent-msg-id',
          },
        ],
      };
      mockPrisma.directMessage.update.mockResolvedValue(mockDm);
      mockGetAblyRest.mockReturnValue(null);

      const result = await service.createMessage('dm-1', 'user-1', {
        content: 'Hello',
        replyToId: 'parent-msg-id',
      });

      expect(result.replyToId).toBe('parent-msg-id');
      expect(mockPrisma.directMessage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            messages: expect.objectContaining({
              include: expect.objectContaining({
                attachments: expect.any(Object),
                sender: expect.any(Object),
              }),
            }),
          }),
        })
      );
    });

    it('should handle attachments correctly in the nested create', async () => {
      mockPrisma.directMessage.update.mockResolvedValue({
        messages: [{ id: 'msg-1', sender: {}, attachments: [], createdAt: new Date() }],
      });
      mockGetAblyRest.mockReturnValue(null);

      const attachments = [{ name: 'file.txt', type: 'text/plain', url: 'http://example.com', size: '123' }];
      await service.createMessage('dm-1', 'user-1', { content: 'Hello', attachments });

      expect(mockPrisma.directMessage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            messages: expect.objectContaining({
              create: expect.objectContaining({
                attachments: expect.objectContaining({
                  create: expect.arrayContaining([
                    expect.objectContaining({ name: 'file.txt', url: 'http://example.com' }),
                  ]),
                }),
              }),
            }),
          }),
        })
      );
    });
  });
});

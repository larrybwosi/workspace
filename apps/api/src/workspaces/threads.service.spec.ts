import { Test, TestingModule } from '@nestjs/testing';
import { MessagesService } from './messages.service';
import { prisma } from '@repo/database';
import { vi, describe, beforeEach, it, expect } from 'vitest';

vi.mock('@repo/database', () => ({
  prisma: {
    message: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn((args) => Promise.all(args)),
    user: {
      update: vi.fn(),
    },
  },
}));

vi.mock('@repo/shared/server', () => ({
  AblyChannels: {
    channel: vi.fn((id) => `channel:${id}`),
    user: vi.fn((id) => `user:${id}`),
  },
  AblyEvents: {
    MESSAGE_SENT: 'message:sent',
  },
  publishRealtime: vi.fn().mockResolvedValue(undefined),
  notifyMentions: vi.fn().mockResolvedValue(undefined),
  notifyChannel: vi.fn().mockResolvedValue(undefined),
  extractUserMentions: vi.fn().mockReturnValue([]),
  extractChannelMentions: vi.fn().mockReturnValue([]),
  hasSpecialMention: vi.fn().mockReturnValue(false),
  extractUserIds: vi.fn().mockReturnValue([]),
  isUserEligibleForAsset: vi.fn().mockResolvedValue(true),
  logAssetUsage: vi.fn().mockResolvedValue(undefined),
}));

describe('MessagesService - Threads', () => {
  let service: MessagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MessagesService],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
    vi.clearAllMocks();
  });

  it('should filter by threadId in getMessages', async () => {
    (prisma.message.findMany as any).mockResolvedValue([]);

    await service.getMessages('chan-1', 'user-1', undefined, 50, 'thread-123');

    expect(prisma.message.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        channelId: 'chan-1',
        threadId: 'thread-123',
      }),
    }));
  });

  it('should use threadId: null when no threadId is provided in getMessages', async () => {
    (prisma.message.findMany as any).mockResolvedValue([]);

    await service.getMessages('chan-1', 'user-1');

    expect(prisma.message.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        channelId: 'chan-1',
        threadId: null,
      }),
    }));
  });

  it('should persist threadId in createMessage', async () => {
    const mockMessage = { id: 'msg-1', channelId: 'chan-1', user: { name: 'Test' } };
    (prisma.message.create as any).mockResolvedValue(mockMessage);
    (prisma.user.update as any).mockResolvedValue({});

    await service.createMessage('user-1', {
      channelId: 'chan-1',
      content: 'threaded reply',
      threadId: 'thread-123'
    });

    expect(prisma.message.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        threadId: 'thread-123',
      }),
    }));
  });
});

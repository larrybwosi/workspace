import { Test, TestingModule } from '@nestjs/testing';
import { MessagesService } from './messages.service';
import { prisma } from '@repo/database';
import * as sharedServer from '@repo/shared/server';
import { vi, describe, beforeEach, it, expect } from 'vitest';

vi.mock('@repo/database', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    message: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    workspace: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((args) => Promise.all(args)),
  },
}));

vi.mock('@repo/shared/server', () => ({
  AblyChannels: {
    channel: vi.fn((id) => `channel:${id}`),
    user: vi.fn((id) => `user:${id}`),
  },
  AblyEvents: {
    MESSAGE_SENT: 'message:sent',
    MESSAGE_UPDATED: 'message:updated',
  },
  publishRealtime: vi.fn().mockResolvedValue(undefined),
  notifyMentions: vi.fn().mockResolvedValue(undefined),
  notifyChannel: vi.fn().mockResolvedValue(undefined),
  extractUserMentions: vi.fn().mockReturnValue([]),
  extractChannelMentions: vi.fn().mockReturnValue([]),
  hasSpecialMention: vi.fn().mockReturnValue(false),
  extractUserIds: vi.fn().mockReturnValue([]),
}));

describe('MessagesService', () => {
  let service: MessagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MessagesService],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
  });

  it('should call publishRealtime when creating a message', async () => {
    const mockMessage = { id: 'msg-1', channelId: 'chan-1', user: { name: 'Test' } };
    (prisma.message.create as any).mockResolvedValue(mockMessage);
    (prisma.user.update as any).mockResolvedValue({});

    await service.createMessage('user-1', { channelId: 'chan-1', content: 'hello' });

    expect(sharedServer.publishRealtime).toHaveBeenCalledWith(
      'channel:chan-1',
      'message:sent',
      mockMessage
    );
  });
});

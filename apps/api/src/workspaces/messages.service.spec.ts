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
    channel: {
      findUnique: vi.fn(),
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
    (prisma.channel.findUnique as any).mockResolvedValue({
      id: 'chan-1',
      isPrivate: false,
      type: 'public',
      members: [],
    });
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

  it('should allow sending a message to a private channel if user is a member of that channel', async () => {
    (prisma.channel.findUnique as any).mockResolvedValue({
      id: 'chan-2',
      isPrivate: true,
      type: 'private',
      members: [{ userId: 'user-1' }],
    });
    const mockMessage = { id: 'msg-2', channelId: 'chan-2', user: { name: 'Test' } };
    (prisma.message.create as any).mockResolvedValue(mockMessage);
    (prisma.user.update as any).mockResolvedValue({});

    const result = await service.createMessage('user-1', { channelId: 'chan-2', content: 'private hello' });
    expect(result).toEqual(mockMessage);
  });

  it('should throw ForbiddenException when sending a message to a private channel if user is not a member', async () => {
    (prisma.channel.findUnique as any).mockResolvedValue({
      id: 'chan-2',
      isPrivate: true,
      type: 'private',
      members: [],
    });

    await expect(
      service.createMessage('user-1', { channelId: 'chan-2', content: 'hack' })
    ).rejects.toThrow('You do not have permission to send messages to this private channel');
  });
});

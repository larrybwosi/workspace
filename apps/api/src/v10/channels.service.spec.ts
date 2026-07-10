import { Test, TestingModule } from '@nestjs/testing';
import { V10ChannelsService } from './channels.service';
import { prisma } from '@repo/database';
import * as sharedServer from '@repo/shared/server';
import { vi, describe, beforeEach, it, expect } from 'vitest';

vi.mock('@repo/database', () => ({
  prisma: {
    channel: {
      findUnique: vi.fn(),
    },
    message: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    workspaceAuditLog: {
      create: vi.fn().mockReturnValue({ catch: vi.fn() }),
    },
  },
}));

vi.mock('@repo/shared/server', () => ({
  AblyChannels: {
    channel: vi.fn((id) => `channel:${id}`),
  },
  AblyEvents: {
    MESSAGE_SENT: 'message:sent',
  },
  publishRealtime: vi.fn().mockResolvedValue(undefined),
  notifyAppExclusive: vi.fn().mockResolvedValue(undefined),
}));

describe('V10ChannelsService', () => {
  let service: V10ChannelsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [V10ChannelsService],
    }).compile();

    service = module.get<V10ChannelsService>(V10ChannelsService);
  });

  it('should call publishRealtime when creating a bot message', async () => {
    const bot = { id: 'bot-1', name: 'Bot' };
    const data = { content: 'bot hello' };

    (prisma.channel.findUnique as any).mockResolvedValue({
      id: 'chan-1',
      workspaceId: 'ws-1',
      members: [{ permissions: 2048n }], // SEND_MESSAGES
      workspace: { members: [] }
    });
    (prisma.message.create as any).mockResolvedValue({
      id: 'msg-1',
      channelId: 'chan-1',
      timestamp: new Date()
    });

    await service.createMessage(bot, 'chan-1', data);

    expect(sharedServer.publishRealtime).toHaveBeenCalledWith(
      'channel:chan-1',
      'message:sent',
      expect.objectContaining({
        message: expect.objectContaining({ id: 'msg-1' })
      })
    );
  });
});

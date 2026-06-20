import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ChannelsService } from './channels.service';
import { NotificationsService } from '../notifications/notifications.service';
import * as sharedServer from '@repo/shared/server';

// Mock @repo/database
vi.mock('@repo/database', () => ({
  prisma: {
    channel: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    message: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    messageRead: {
      createMany: vi.fn(),
      upsert: vi.fn(),
    },
    reaction: {
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    sticker: {
      findUnique: vi.fn(),
    },
    sharedChannel: {
      findFirst: vi.fn(),
    },
    workspaceMember: {
      findUnique: vi.fn(),
    },
    channelMember: {
      findUnique: vi.fn(),
    },
    supportTicket: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(async (cb) => {
       if (typeof cb === 'function') return cb(prisma);
       return Promise.all(cb);
    }),
  },
}));

vi.mock('@repo/shared/server', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    publishRealtime: vi.fn().mockResolvedValue(undefined),
    getAblyRest: vi.fn(),
  };
});

// Mock mention-utils
vi.mock('../common/utils/mention-utils', () => ({
  extractUserMentions: vi.fn().mockReturnValue([]),
  extractChannelMentions: vi.fn().mockReturnValue([]),
  extractUserIds: vi.fn().mockReturnValue([]),
  hasSpecialMention: vi.fn().mockReturnValue(false),
}));

import { prisma } from '@repo/database';

describe('ChannelsService', () => {
  let service: ChannelsService;
  const mockPrisma = prisma as any;

  const mockNotifyMentions = vi.fn().mockResolvedValue(undefined);
  const mockNotifyChannel = vi.fn().mockResolvedValue(undefined);
  const mockNotifyNewMessage = vi.fn().mockResolvedValue(undefined);

  const mockNotificationsService = {
    notifyMentions: mockNotifyMentions,
    notifyChannel: mockNotifyChannel,
    notifyNewMessage: mockNotifyNewMessage,
    notifyReply: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChannelsService,
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<ChannelsService>(ChannelsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getGlobalChannels', () => {
    it('should use _count optimization', async () => {
      mockPrisma.channel.findMany.mockResolvedValue([]);
      await service.getGlobalChannels();
      const callArg = mockPrisma.channel.findMany.mock.calls[0][0];
      expect(callArg.include).toHaveProperty('_count');
    });
  });

  describe('markAsRead', () => {
    it('should use batch createMany optimization', async () => {
      mockPrisma.messageRead.createMany.mockResolvedValue({ count: 1 });
      await service.markAsRead('user-1', ['msg-1']);
      expect(mockPrisma.messageRead.createMany).toHaveBeenCalledWith(
        expect.objectContaining({ skipDuplicates: true })
      );
    });

    it('should call publishRealtime when channelId is provided', async () => {
      mockPrisma.messageRead.createMany.mockResolvedValue({ count: 1 });
      await service.markAsRead('user-1', ['msg-1'], 'ch-1');
      expect(sharedServer.publishRealtime).toHaveBeenCalled();
    });
  });

  describe('removeReaction', () => {
    it('should use atomic delete optimization', async () => {
      mockPrisma.reaction.delete.mockResolvedValue({ id: 'r-1' });
      await service.removeReaction('ch-1', 'msg-1', 'user-1', '👍');
      expect(mockPrisma.reaction.delete).toHaveBeenCalled();
    });

    it('should call publishRealtime', async () => {
      mockPrisma.reaction.delete.mockResolvedValue({ id: 'r-1' });
      await service.removeReaction('ch-1', 'msg-1', 'user-1', '👍');
      expect(sharedServer.publishRealtime).toHaveBeenCalled();
    });

    it('should handle P2025 error gracefully', async () => {
      mockPrisma.reaction.delete.mockRejectedValue({ code: 'P2025' });
      const result = await service.removeReaction('ch-1', 'msg-1', 'user-1', '👍');
      expect(result).toEqual({ success: true });
    });
  });
});

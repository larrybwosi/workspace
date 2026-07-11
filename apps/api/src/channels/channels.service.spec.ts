import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ChannelsService } from './channels.service';
import { NotificationsService } from '../notifications/notifications.service';
import * as sharedServer from '@repo/shared/server';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

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

  describe('getMessages', () => {
    const userId = 'user-1';
    const channelId = 'channel-1';

    it('should throw NotFoundException if channel does not exist', async () => {
      mockPrisma.channel.findUnique.mockResolvedValue(null);
      await expect(service.getMessages(channelId, userId)).rejects.toThrow(NotFoundException);
    });

    it('should allow access if user is a direct member', async () => {
      mockPrisma.channel.findUnique.mockResolvedValue({
        id: channelId,
        isPrivate: true,
        members: [{ userId }],
        workspace: { members: [] },
        sharedWith: [],
      });
      mockPrisma.message.findMany.mockResolvedValue([]);

      await service.getMessages(channelId, userId);
      expect(mockPrisma.message.findMany).toHaveBeenCalled();
    });

    it('should allow access if user is a workspace member of a public channel', async () => {
      mockPrisma.channel.findUnique.mockResolvedValue({
        id: channelId,
        workspaceId: 'workspace-1',
        isPrivate: false,
        members: [],
        workspace: { members: [{ userId }] },
        sharedWith: [],
      });
      mockPrisma.message.findMany.mockResolvedValue([]);

      await service.getMessages(channelId, userId);
      expect(mockPrisma.message.findMany).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if workspace member tries to access a private channel without direct membership', async () => {
      mockPrisma.channel.findUnique.mockResolvedValue({
        id: channelId,
        workspaceId: 'workspace-1',
        isPrivate: true,
        members: [],
        workspace: { members: [{ userId }] },
        sharedWith: [],
      });

      await expect(service.getMessages(channelId, userId)).rejects.toThrow(ForbiddenException);
    });

    it('should allow access if user has shared access through their workspace', async () => {
      mockPrisma.channel.findUnique.mockResolvedValue({
        id: channelId,
        workspaceId: 'workspace-1',
        isPrivate: false,
        members: [],
        workspace: { members: [] },
        sharedWith: [{ id: 'shared-1' }], // Filtered to current user's workspace in the query
      });
      mockPrisma.message.findMany.mockResolvedValue([]);

      await service.getMessages(channelId, userId);
      expect(mockPrisma.message.findMany).toHaveBeenCalled();
    });

    it('should return messages in newest-first order (no reverse)', async () => {
      const msg1 = { id: '1', timestamp: new Date('2023-01-01T12:00:00Z'), reactions: [], mentions: [], readBy: [] };
      const msg2 = { id: '2', timestamp: new Date('2023-01-01T11:00:00Z'), reactions: [], mentions: [], readBy: [] };

      mockPrisma.channel.findUnique.mockResolvedValue({
        id: channelId,
        members: [{ userId }],
        workspace: { members: [] },
        sharedWith: [],
      });
      // messages.findMany returns in desc order as requested in the query
      mockPrisma.message.findMany.mockResolvedValue([msg1, msg2]);

      const result = await service.getMessages(channelId, userId);

      // Verification of newest-first order (descending)
      expect(result.messages[0].id).toBe('1');
      expect(result.messages[1].id).toBe('2');
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

  describe('getMessages', () => {
    const channelId = 'ch-1';
    const userId = 'user-1';
    const workspaceId = 'ws-1';

    beforeEach(() => {
      mockPrisma.message.findMany.mockResolvedValue([]);
    });

    it('should allow access for direct channel member', async () => {
      mockPrisma.channel.findUnique.mockResolvedValue({
        id: channelId,
        workspaceId,
        isPrivate: true,
        members: [{ id: 'cm-1' }],
        workspace: { members: [] },
        sharedWith: [],
      });

      await service.getMessages(channelId, userId);

      expect(mockPrisma.message.findMany).toHaveBeenCalled();
    });

    it('should allow access for workspace member (public channel)', async () => {
      mockPrisma.channel.findUnique.mockResolvedValue({
        id: channelId,
        workspaceId,
        isPrivate: false,
        members: [],
        workspace: { members: [{ id: 'wm-1' }] },
        sharedWith: [],
      });

      await service.getMessages(channelId, userId);

      expect(mockPrisma.message.findMany).toHaveBeenCalled();
    });

    it('should allow access for shared channel member', async () => {
      mockPrisma.channel.findUnique.mockResolvedValue({
        id: channelId,
        workspaceId,
        isPrivate: true,
        members: [],
        workspace: { members: [] },
        sharedWith: [{ id: 'sc-1' }],
      });

      await service.getMessages(channelId, userId);

      expect(mockPrisma.message.findMany).toHaveBeenCalled();
    });

    it('should deny access for workspace member to private channel without membership', async () => {
      mockPrisma.channel.findUnique.mockResolvedValue({
        id: channelId,
        workspaceId,
        isPrivate: true,
        members: [],
        workspace: { members: [{ id: 'wm-1' }] },
        sharedWith: [],
      });

      await expect(service.getMessages(channelId, userId)).rejects.toThrow('You do not have access to this private channel');
    });

    it('should deny access for unauthorized user', async () => {
      mockPrisma.channel.findUnique.mockResolvedValue({
        id: channelId,
        workspaceId,
        isPrivate: false,
        members: [],
        workspace: { members: [] },
        sharedWith: [],
      });

      await expect(service.getMessages(channelId, userId)).rejects.toThrow('You do not have access to this channel');
    });

    it('should throw NotFoundException if channel does not exist', async () => {
      mockPrisma.channel.findUnique.mockResolvedValue(null);

      await expect(service.getMessages(channelId, userId)).rejects.toThrow('Channel not found');
    });
  });
});

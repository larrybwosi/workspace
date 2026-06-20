import { Test, TestingModule } from '@nestjs/testing';
import { DmsService } from './dms.service';
import { prisma } from '@repo/database';
import { AblyChannels, AblyEvents, publishRealtime } from '@repo/shared/server';
import { NotificationsService } from '../notifications/notifications.service';
import { vi, describe, beforeEach, it, expect, afterEach } from 'vitest';

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
    },
    dMReaction: {
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(args => Promise.all(args)),
  },
}));

vi.mock('@repo/shared/server', () => ({
  getAblyRest: vi.fn(),
  publishRealtime: vi.fn().mockResolvedValue(undefined),
  AblyChannels: {
    user: vi.fn(id => `user:${id}`),
    dm: vi.fn(id => `dm:${id}`),
  },
  AblyEvents: {
    DM_RECEIVED: 'dm:received',
    MESSAGE_SENT: 'message:sent',
    MESSAGE_UPDATED: 'message:updated',
    MESSAGE_DELETED: 'message:deleted',
    MESSAGE_READ: 'message:read',
    MESSAGE_REACTION: 'message:reaction',
  },
}));

describe('DmsService', () => {
  let service: DmsService;
  let notificationsService: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DmsService,
        {
          provide: NotificationsService,
          useValue: {
            notifyDM: vi.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<DmsService>(DmsService);
    notificationsService = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createDm', () => {
    it('should create a new DM and publish to Ably', async () => {
      const mockDm = {
        id: 'dm-1',
        participant1Id: 'user-1',
        participant2Id: 'user-2',
        participant1: { id: 'user-1', name: 'User 1' },
        participant2: { id: 'user-2', name: 'User 2' },
      };

      (prisma.directMessage.findFirst as any).mockResolvedValue(null);
      (prisma.directMessage.create as any).mockResolvedValue(mockDm);

      const result = await service.createDm('user-1', 'user-2', 'User 1');

      expect(prisma.directMessage.create).toHaveBeenCalled();
      expect(publishRealtime).toHaveBeenCalledWith('user:user-2', AblyEvents.DM_RECEIVED, {
        dmId: 'dm-1',
        from: 'User 1',
      });
      expect(result.id).toBe('dm-1');
    });
  });

  describe('createMessage', () => {
    it('should create a message, update DM timestamp, publish to Ably, and notify', async () => {
      const mockMessage = {
        id: 'msg-1',
        dmId: 'dm-1',
        senderId: 'user-1',
        content: 'hello',
        createdAt: new Date(),
        sender: { id: 'user-1', name: 'User 1' },
      };
      const mockDm = { id: 'dm-1', participant1Id: 'user-1', participant2Id: 'user-2' };

      (prisma.dMMessage.create as any).mockResolvedValue(mockMessage);
      (prisma.directMessage.update as any).mockResolvedValue(mockDm);

      const result = await service.createMessage('dm-1', 'user-1', { content: 'hello' });

      expect(prisma.dMMessage.create).toHaveBeenCalled();
      expect(prisma.directMessage.update).toHaveBeenCalledWith({
        where: { id: 'dm-1' },
        data: { lastMessageAt: expect.any(Date) },
        select: expect.any(Object),
      });
      expect(publishRealtime).toHaveBeenCalledWith('dm:dm-1', AblyEvents.MESSAGE_SENT, expect.any(Object));
      expect(notificationsService.notifyDM).toHaveBeenCalledWith(
        'dm-1',
        'user-1',
        'User 1',
        'user-2',
        'msg-1',
        'hello'
      );
      expect(result.id).toBe('msg-1');
    });
  });

  describe('markAsRead', () => {
    it('should batch create read receipts and publish read event', async () => {
      const userId = 'user-1';
      const messageIds = ['msg-1', 'msg-2'];
      const dmId = 'dm-1';

      await service.markAsRead(userId, messageIds, dmId);

      expect(prisma.dMMessageRead.createMany).toHaveBeenCalledWith({
        data: [
          { messageId: 'msg-1', userId, readAt: expect.any(Date) },
          { messageId: 'msg-2', userId, readAt: expect.any(Date) },
        ],
        skipDuplicates: true,
      });

      expect(publishRealtime).toHaveBeenCalledWith('user:user-1', AblyEvents.MESSAGE_READ, {
        dmId,
        messageIds,
      });
    });

    it('should lookup dmId if not provided', async () => {
      (prisma.dMMessage.findUnique as any).mockResolvedValue({ dmId: 'dm-auto' });

      await service.markAsRead('user-1', ['msg-1']);

      expect(publishRealtime).toHaveBeenCalledWith('user:user-1', AblyEvents.MESSAGE_READ, {
        dmId: 'dm-auto',
        messageIds: ['msg-1'],
      });
    });
  });

  describe('reactions', () => {
    it('should add reaction and publish', async () => {
      (prisma.dMReaction.upsert as any).mockResolvedValue({ id: 'react-1' });

      await service.addReaction('dm-1', 'msg-1', 'user-1', '😀');

      expect(prisma.dMReaction.upsert).toHaveBeenCalled();
      expect(publishRealtime).toHaveBeenCalledWith('dm:dm-1', AblyEvents.MESSAGE_REACTION, {
        messageId: 'msg-1',
        reaction: { id: 'react-1' },
        action: 'add',
      });
    });

    it('should remove reaction and publish', async () => {
      await service.removeReaction('dm-1', 'msg-1', 'user-1', '😀');

      expect(prisma.dMReaction.delete).toHaveBeenCalled();
      expect(publishRealtime).toHaveBeenCalledWith('dm:dm-1', AblyEvents.MESSAGE_REACTION, {
        messageId: 'msg-1',
        emoji: '😀',
        userId: 'user-1',
        action: 'remove',
      });
    });
  });
});

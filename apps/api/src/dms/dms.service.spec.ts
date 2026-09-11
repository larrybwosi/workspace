import { Test, TestingModule } from '@nestjs/testing';
import { DmsService } from './dms.service';
import { prisma } from '@repo/database';
import { AblyChannels, AblyEvents, publishRealtime } from '@repo/shared/server';
import { NotificationsService } from '../notifications/notifications.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { vi, describe, beforeEach, it, expect, afterEach } from 'vitest';

vi.mock('@repo/database', () => ({
  prisma: {
    directMessage: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
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

      (prisma.directMessage.upsert as any).mockResolvedValue(mockDm);

      const result = await service.createDm('user-1', 'user-2', 'User 1');

      expect(prisma.directMessage.upsert).toHaveBeenCalled();
      expect(publishRealtime).toHaveBeenCalledWith('user:user-2', AblyEvents.DM_RECEIVED, {
        dmId: 'dm-1',
        from: 'User 1',
      });
      expect(result.id).toBe('dm-1');
    });
  });

  describe('deleteDm', () => {
    it('should throw NotFoundException if DM conversation does not exist', async () => {
      (prisma.directMessage.findUnique as any).mockResolvedValue(null);

      await expect(service.deleteDm('dm-nonexistent', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not a participant', async () => {
      (prisma.directMessage.findUnique as any).mockResolvedValue({
        participant1Id: 'user-1',
        participant2Id: 'user-2',
      });

      await expect(service.deleteDm('dm-1', 'user-attacker')).rejects.toThrow(ForbiddenException);
    });

    it('should delete DM if user is a participant', async () => {
      (prisma.directMessage.findUnique as any).mockResolvedValue({
        participant1Id: 'user-1',
        participant2Id: 'user-2',
      });
      (prisma.directMessage.delete as any).mockResolvedValue({ id: 'dm-1' });

      const res = await service.deleteDm('dm-1', 'user-1');
      expect(prisma.directMessage.delete).toHaveBeenCalledWith({ where: { id: 'dm-1' } });
      expect(res).toEqual({ success: true });
    });
  });

  describe('createMessage', () => {
    it('should throw NotFoundException if DM conversation does not exist', async () => {
      (prisma.directMessage.findUnique as any).mockResolvedValue(null);

      await expect(service.createMessage('dm-1', 'user-1', { content: 'hello' })).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if non-participant tries to send message', async () => {
      (prisma.directMessage.findUnique as any).mockResolvedValue({
        participant1Id: 'user-1',
        participant2Id: 'user-2',
      });

      await expect(service.createMessage('dm-1', 'user-attacker', { content: 'hello' })).rejects.toThrow(ForbiddenException);
    });

    it('should create a message, update DM timestamp, publish to Ably, and notify', async () => {
      const mockDmParticipantCheck = { participant1Id: 'user-1', participant2Id: 'user-2' };
      const mockMessage = {
        id: 'msg-1',
        dmId: 'dm-1',
        senderId: 'user-1',
        content: 'hello',
        createdAt: new Date(),
        sender: { id: 'user-1', name: 'User 1' },
      };
      const mockDm = { id: 'dm-1', participant1Id: 'user-1', participant2Id: 'user-2' };

      (prisma.directMessage.findUnique as any).mockResolvedValue(mockDmParticipantCheck);
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

  describe('updateMessage', () => {
    it('should throw NotFoundException if message does not exist', async () => {
      (prisma.dMMessage.findUnique as any).mockResolvedValue(null);

      await expect(service.updateMessage('dm-1', 'msg-999', 'user-1', 'new content')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if message belongs to a different conversation', async () => {
      (prisma.dMMessage.findUnique as any).mockResolvedValue({
        dmId: 'dm-other',
        senderId: 'user-1',
      });

      await expect(service.updateMessage('dm-1', 'msg-1', 'user-1', 'new content')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the author of the message', async () => {
      (prisma.dMMessage.findUnique as any).mockResolvedValue({
        dmId: 'dm-1',
        senderId: 'user-1',
      });

      await expect(service.updateMessage('dm-1', 'msg-1', 'user-attacker', 'new content')).rejects.toThrow(ForbiddenException);
    });

    it('should update message successfully when user is author', async () => {
      (prisma.dMMessage.findUnique as any).mockResolvedValue({
        dmId: 'dm-1',
        senderId: 'user-1',
      });

      const updatedMsg = {
        id: 'msg-1',
        dmId: 'dm-1',
        senderId: 'user-1',
        content: 'new content',
        createdAt: new Date(),
        sender: { id: 'user-1', name: 'User 1' },
      };
      (prisma.dMMessage.update as any).mockResolvedValue(updatedMsg);

      const res = await service.updateMessage('dm-1', 'msg-1', 'user-1', 'new content');
      expect(res.content).toBe('new content');
    });
  });

  describe('deleteMessage', () => {
    it('should throw NotFoundException if message does not exist', async () => {
      (prisma.dMMessage.findUnique as any).mockResolvedValue(null);

      await expect(service.deleteMessage('dm-1', 'msg-999', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if message belongs to another conversation', async () => {
      (prisma.dMMessage.findUnique as any).mockResolvedValue({
        dmId: 'dm-other',
        senderId: 'user-1',
      });

      await expect(service.deleteMessage('dm-1', 'msg-1', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if non-author attempts to delete message', async () => {
      (prisma.dMMessage.findUnique as any).mockResolvedValue({
        dmId: 'dm-1',
        senderId: 'user-1',
      });

      await expect(service.deleteMessage('dm-1', 'msg-1', 'user-attacker')).rejects.toThrow(ForbiddenException);
    });

    it('should delete message successfully when user is author', async () => {
      (prisma.dMMessage.findUnique as any).mockResolvedValue({
        dmId: 'dm-1',
        senderId: 'user-1',
      });
      (prisma.dMMessage.delete as any).mockResolvedValue({ id: 'msg-1' });

      const res = await service.deleteMessage('dm-1', 'msg-1', 'user-1');
      expect(prisma.dMMessage.delete).toHaveBeenCalledWith({ where: { id: 'msg-1' } });
      expect(res).toEqual({ success: true });
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

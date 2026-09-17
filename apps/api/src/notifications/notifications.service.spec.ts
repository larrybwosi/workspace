import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { prisma } from '@repo/database';
import * as sharedServer from '@repo/shared/server';
import { vi, describe, beforeEach, it, expect } from 'vitest';

vi.mock('@repo/database', () => ({
  prisma: {
    notification: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    workspaceMember: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    channelMember: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@repo/shared/server', () => ({
  AblyChannels: {
    notifications: vi.fn((id) => `notifications:${id}`),
  },
  AblyEvents: {
    NOTIFICATION: 'notification',
  },
  publishRealtime: vi.fn().mockResolvedValue(undefined),
  queueNotification: vi.fn().mockResolvedValue(undefined),
  notifyMention: vi.fn(),
  notifyMentions: vi.fn(),
  notifyChannel: vi.fn(),
  notifyDM: vi.fn(),
  notifyNewMessage: vi.fn(),
  notifyReply: vi.fn(),
}));

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationsService],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('getNotificationById', () => {
    it('should return notification when id exists and belongs to user', async () => {
      const mockNotification = { id: 'notif-1', userId: 'user-1', title: 'Test' };
      (prisma.notification.findUnique as any).mockResolvedValue(mockNotification);

      const result = await service.getNotificationById('user-1', 'notif-1');

      expect(prisma.notification.findUnique).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
      });
      expect(result).toEqual(mockNotification);
    });

    it('should return null if notification belongs to another user', async () => {
      const mockNotification = { id: 'notif-1', userId: 'other-user', title: 'Test' };
      (prisma.notification.findUnique as any).mockResolvedValue(mockNotification);

      const result = await service.getNotificationById('user-1', 'notif-1');

      expect(prisma.notification.findUnique).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
      });
      expect(result).toBeNull();
    });

    it('should return null if notification is not found', async () => {
      (prisma.notification.findUnique as any).mockResolvedValue(null);

      const result = await service.getNotificationById('user-1', 'notif-999');

      expect(prisma.notification.findUnique).toHaveBeenCalledWith({
        where: { id: 'notif-999' },
      });
      expect(result).toBeNull();
    });
  });

  it('should call publishRealtime when creating a notification', async () => {
    const mockNotification = { id: 'notif-1', userId: 'user-1', createdAt: new Date() };
    (prisma.notification.create as any).mockResolvedValue(mockNotification);

    await service.createNotification({
      userId: 'user-1',
      type: 'mention',
      title: 'New Mention',
      message: 'You were mentioned',
    });

    expect(sharedServer.publishRealtime).toHaveBeenCalledWith(
      'notifications:user-1',
      'notification',
      expect.objectContaining({ id: 'notif-1' })
    );
  });

  describe('updateNotification (BOLA/IDOR Protection)', () => {
    it('should throw NotFoundException if notification does not exist', async () => {
      (prisma.notification.findUnique as any).mockResolvedValue(null);

      await expect(service.updateNotification('user-1', 'notif-1', true)).rejects.toThrow('Notification not found');
    });

    it('should throw NotFoundException if notification belongs to another user', async () => {
      (prisma.notification.findUnique as any).mockResolvedValue({ id: 'notif-1', userId: 'other-user' });

      await expect(service.updateNotification('user-1', 'notif-1', true)).rejects.toThrow('Notification not found');
    });

    it('should update notification when user is the owner', async () => {
      (prisma.notification.findUnique as any).mockResolvedValue({ id: 'notif-1', userId: 'user-1' });
      (prisma.notification.update as any).mockResolvedValue({ id: 'notif-1', userId: 'user-1', isRead: true });

      const result = await service.updateNotification('user-1', 'notif-1', true);
      expect(result).toEqual({ id: 'notif-1', userId: 'user-1', isRead: true });
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { isRead: true },
      });
    });
  });

  describe('deleteNotification (BOLA/IDOR Protection)', () => {
    it('should throw NotFoundException if notification does not exist', async () => {
      (prisma.notification.findUnique as any).mockResolvedValue(null);

      await expect(service.deleteNotification('user-1', 'notif-1')).rejects.toThrow('Notification not found');
    });

    it('should throw NotFoundException if notification belongs to another user', async () => {
      (prisma.notification.findUnique as any).mockResolvedValue({ id: 'notif-1', userId: 'other-user' });

      await expect(service.deleteNotification('user-1', 'notif-1')).rejects.toThrow('Notification not found');
    });

    it('should delete notification when user is the owner', async () => {
      (prisma.notification.findUnique as any).mockResolvedValue({ id: 'notif-1', userId: 'user-1' });
      (prisma.notification.delete as any).mockResolvedValue({ id: 'notif-1' });

      const result = await service.deleteNotification('user-1', 'notif-1');
      expect(result).toEqual({ success: true });
      expect(prisma.notification.delete).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
      });
    });
  });

  describe('workspace notification settings (BOLA/IDOR Protection)', () => {
    it('should throw NotFoundException when user is not a member in getWorkspaceSettings', async () => {
      (prisma.workspaceMember.findUnique as any).mockResolvedValue(null);

      await expect(service.getWorkspaceSettings('user-1', 'ws-1')).rejects.toThrow('Workspace member not found');
    });

    it('should return settings when user is a member in getWorkspaceSettings', async () => {
      (prisma.workspaceMember.findUnique as any).mockResolvedValue({ notificationPreference: 'mentions' });

      const result = await service.getWorkspaceSettings('user-1', 'ws-1');
      expect(result).toEqual({ notificationPreference: 'mentions' });
    });

    it('should throw NotFoundException when user is not a member in updateWorkspaceSettings', async () => {
      (prisma.workspaceMember.findUnique as any).mockResolvedValue(null);

      await expect(service.updateWorkspaceSettings('user-1', 'ws-1', 'none')).rejects.toThrow('Workspace member not found');
    });

    it('should update settings when user is a member in updateWorkspaceSettings', async () => {
      (prisma.workspaceMember.findUnique as any).mockResolvedValue({ workspaceId: 'ws-1', userId: 'user-1' });
      (prisma.workspaceMember.update as any).mockResolvedValue({ workspaceId: 'ws-1', userId: 'user-1', notificationPreference: 'none' });

      const result = await service.updateWorkspaceSettings('user-1', 'ws-1', 'none');
      expect(result).toEqual({ workspaceId: 'ws-1', userId: 'user-1', notificationPreference: 'none' });
    });
  });

  describe('channel notification settings (BOLA/IDOR Protection)', () => {
    it('should throw NotFoundException when user is not a member in getChannelSettings', async () => {
      (prisma.channelMember.findUnique as any).mockResolvedValue(null);

      await expect(service.getChannelSettings('user-1', 'ch-1')).rejects.toThrow('Channel member not found');
    });

    it('should return settings when user is a member in getChannelSettings', async () => {
      (prisma.channelMember.findUnique as any).mockResolvedValue({ notificationPreference: 'all' });

      const result = await service.getChannelSettings('user-1', 'ch-1');
      expect(result).toEqual({ notificationPreference: 'all' });
    });

    it('should throw NotFoundException when user is not a member in updateChannelSettings', async () => {
      (prisma.channelMember.findUnique as any).mockResolvedValue(null);

      await expect(service.updateChannelSettings('user-1', 'ch-1', 'none')).rejects.toThrow('Channel member not found');
    });

    it('should update settings when user is a member in updateChannelSettings', async () => {
      (prisma.channelMember.findUnique as any).mockResolvedValue({ channelId: 'ch-1', userId: 'user-1' });
      (prisma.channelMember.update as any).mockResolvedValue({ channelId: 'ch-1', userId: 'user-1', notificationPreference: 'none' });

      const result = await service.updateChannelSettings('user-1', 'ch-1', 'none');
      expect(result).toEqual({ channelId: 'ch-1', userId: 'user-1', notificationPreference: 'none' });
    });
  });
});

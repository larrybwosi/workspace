import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ScheduledNotificationsController } from './scheduled-notifications.controller';
import { AuthGuard } from '../auth/auth.guard';
import { NotFoundException } from '@nestjs/common';
import * as sharedServer from '@repo/shared/server';

vi.mock('@repo/shared/server', () => ({
  createScheduledNotification: vi.fn(),
  getUserScheduledNotifications: vi.fn(),
  getNotificationStats: vi.fn(),
  updateScheduledNotification: vi.fn(),
  deleteScheduledNotification: vi.fn(),
  pauseScheduledNotification: vi.fn(),
  resumeScheduledNotification: vi.fn(),
}));

describe('ScheduledNotificationsController', () => {
  let controller: ScheduledNotificationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScheduledNotificationsController],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ScheduledNotificationsController>(ScheduledNotificationsController);
    vi.clearAllMocks();
  });

  const mockUser = { id: 'user-1', name: 'Alice' } as any;

  describe('getNotifications', () => {
    it('should return scheduled notifications for current user', async () => {
      const mockNotifications = [{ id: 'sn-1', title: 'Test', userId: 'user-1' }];
      vi.mocked(sharedServer.getUserScheduledNotifications).mockResolvedValue(mockNotifications as any);

      const result = await controller.getNotifications(mockUser);

      expect(sharedServer.getUserScheduledNotifications).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockNotifications);
    });

    it('should return notification stats if stats query param is true', async () => {
      const mockStats = { total: 5, active: 3, sent: 1, pending: 2 };
      vi.mocked(sharedServer.getNotificationStats).mockResolvedValue(mockStats as any);

      const result = await controller.getNotifications(mockUser, 'true');

      expect(sharedServer.getNotificationStats).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockStats);
    });
  });

  describe('createNotification', () => {
    it('should create a scheduled notification for current user', async () => {
      const body = {
        title: 'Meeting',
        message: 'Reminder',
        scheduleType: 'once' as const,
        scheduledFor: '2026-01-01T10:00:00.000Z',
      };
      const mockCreated = { id: 'sn-1', ...body, userId: 'user-1' };
      vi.mocked(sharedServer.createScheduledNotification).mockResolvedValue(mockCreated as any);

      const result = await controller.createNotification(mockUser, body as any);

      expect(sharedServer.createScheduledNotification).toHaveBeenCalledWith({
        userId: 'user-1',
        title: 'Meeting',
        message: 'Reminder',
        scheduleType: 'once',
        scheduledFor: new Date('2026-01-01T10:00:00.000Z'),
        recurrence: undefined,
        entityType: undefined,
        entityId: undefined,
        linkUrl: undefined,
        metadata: undefined,
      });
      expect(result).toEqual(mockCreated);
    });
  });

  describe('updateNotification (BOLA/IDOR Protection)', () => {
    it('should allow user to update their own scheduled notification', async () => {
      const updateDto = { title: 'Updated Title' };
      const mockUpdated = { id: 'sn-1', title: 'Updated Title', userId: 'user-1' };
      vi.mocked(sharedServer.updateScheduledNotification).mockResolvedValue(mockUpdated as any);

      const result = await controller.updateNotification(mockUser, 'sn-1', updateDto as any);

      expect(sharedServer.updateScheduledNotification).toHaveBeenCalledWith('sn-1', { title: 'Updated Title' }, 'user-1');
      expect(result).toEqual(mockUpdated);
    });

    it('should allow user to pause their own scheduled notification', async () => {
      const updateDto = { action: 'pause' as const };
      const mockPaused = { id: 'sn-1', isActive: false, userId: 'user-1' };
      vi.mocked(sharedServer.pauseScheduledNotification).mockResolvedValue(mockPaused as any);

      const result = await controller.updateNotification(mockUser, 'sn-1', updateDto as any);

      expect(sharedServer.pauseScheduledNotification).toHaveBeenCalledWith('sn-1', 'user-1');
      expect(result).toEqual(mockPaused);
    });

    it('should allow user to resume their own scheduled notification', async () => {
      const updateDto = { action: 'resume' as const };
      const mockResumed = { id: 'sn-1', isActive: true, userId: 'user-1' };
      vi.mocked(sharedServer.resumeScheduledNotification).mockResolvedValue(mockResumed as any);

      const result = await controller.updateNotification(mockUser, 'sn-1', updateDto as any);

      expect(sharedServer.resumeScheduledNotification).toHaveBeenCalledWith('sn-1', 'user-1');
      expect(result).toEqual(mockResumed);
    });

    it('should throw NotFoundException on BOLA/IDOR attempt to update another user notification', async () => {
      vi.mocked(sharedServer.updateScheduledNotification).mockRejectedValue(
        new Error('Scheduled notification not found or access denied')
      );

      await expect(
        controller.updateNotification(mockUser, 'sn-other-user', { title: 'Hacked' } as any)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteNotification (BOLA/IDOR Protection)', () => {
    it('should allow user to delete their own scheduled notification', async () => {
      const mockDeleted = { id: 'sn-1', userId: 'user-1' };
      vi.mocked(sharedServer.deleteScheduledNotification).mockResolvedValue(mockDeleted as any);

      const result = await controller.deleteNotification(mockUser, 'sn-1');

      expect(sharedServer.deleteScheduledNotification).toHaveBeenCalledWith('sn-1', 'user-1');
      expect(result).toEqual(mockDeleted);
    });

    it('should throw NotFoundException on BOLA/IDOR attempt to delete another user notification', async () => {
      vi.mocked(sharedServer.deleteScheduledNotification).mockRejectedValue(
        new Error('Scheduled notification not found or access denied')
      );

      await expect(controller.deleteNotification(mockUser, 'sn-other-user')).rejects.toThrow(NotFoundException);
    });
  });
});

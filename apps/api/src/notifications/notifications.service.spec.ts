import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { prisma } from '@repo/database';
import * as sharedServer from '@repo/shared/server';
import { vi, describe, beforeEach, it, expect } from 'vitest';

vi.mock('@repo/database', () => ({
  prisma: {
    notification: {
      create: vi.fn(),
    },
    workspaceMember: {
      findUnique: vi.fn(),
    },
    channelMember: {
      findUnique: vi.fn(),
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
});

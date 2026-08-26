import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@repo/database', () => {
  return {
    prisma: {
      deviceToken: {
        findMany: vi.fn(),
        updateMany: vi.fn(),
      },
      pushNotificationLog: {
        create: vi.fn(),
      },
    },
  };
});

import { prisma } from '@repo/database';
import {
  sendPushNotification,
  registerPushNotificationProvider,
  clearPushNotificationProviders,
} from './push-notifications';

describe('sendPushNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearPushNotificationProviders();
  });

  it('returns empty array if user has no active device tokens', async () => {
    vi.mocked(prisma.deviceToken.findMany).mockResolvedValue([]);

    const results = await sendPushNotification({
      userId: 'user-1',
      title: 'Hello',
      body: 'World',
    });

    expect(results).toEqual([]);
    expect(prisma.deviceToken.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', isActive: true },
    });
  });

  it('delivers notification to desktop device using registered provider', async () => {
    const mockDesktopProvider = vi.fn().mockResolvedValue({ success: true });
    registerPushNotificationProvider('desktop', mockDesktopProvider);

    vi.mocked(prisma.deviceToken.findMany).mockResolvedValue([
      {
        id: 'dt-1',
        userId: 'user-1',
        token: 'desktop-token-1',
        platform: 'desktop',
        isActive: true,
        deviceInfo: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as any);

    vi.mocked(prisma.pushNotificationLog.create).mockResolvedValue({} as any);

    const results = await sendPushNotification({
      userId: 'user-1',
      title: 'Desktop Alert',
      body: 'Test message',
    });

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('fulfilled');
    expect(mockDesktopProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        deviceToken: 'desktop-token-1',
        platform: 'desktop',
        title: 'Desktop Alert',
        body: 'Test message',
      })
    );
    expect(prisma.pushNotificationLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        platform: 'desktop',
        deviceToken: 'desktop-token-1',
        title: 'Desktop Alert',
        body: 'Test message',
        status: 'sent',
      }),
    });
  });

  it('delivers to multiple active devices with their respective providers', async () => {
    const mockDesktopProvider = vi.fn().mockResolvedValue({ success: true });
    const mockAndroidProvider = vi.fn().mockResolvedValue({ success: true });
    registerPushNotificationProvider('desktop', mockDesktopProvider);
    registerPushNotificationProvider('android', mockAndroidProvider);

    vi.mocked(prisma.deviceToken.findMany).mockResolvedValue([
      {
        id: 'dt-1',
        userId: 'user-1',
        token: 'desktop-token-1',
        platform: 'desktop',
        isActive: true,
        deviceInfo: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'dt-2',
        userId: 'user-1',
        token: 'android-token-1',
        platform: 'android',
        isActive: true,
        deviceInfo: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as any);

    vi.mocked(prisma.pushNotificationLog.create).mockResolvedValue({} as any);

    const results = await sendPushNotification({
      userId: 'user-1',
      title: 'Multi-device Alert',
      body: 'Broadcast message',
    });

    expect(results).toHaveLength(2);
    expect(results[0].status).toBe('fulfilled');
    expect(results[1].status).toBe('fulfilled');
    expect(mockDesktopProvider).toHaveBeenCalledTimes(1);
    expect(mockAndroidProvider).toHaveBeenCalledTimes(1);
    expect(prisma.pushNotificationLog.create).toHaveBeenCalledTimes(2);
  });

  it('deactivates device token on registration token error', async () => {
    const mockWebProvider = vi.fn().mockRejectedValue({
      code: 'messaging/invalid-registration-token',
      message: 'Invalid registration token',
    });
    registerPushNotificationProvider('web', mockWebProvider);

    vi.mocked(prisma.deviceToken.findMany).mockResolvedValue([
      {
        id: 'dt-1',
        userId: 'user-1',
        token: 'invalid-token',
        platform: 'web',
        isActive: true,
        deviceInfo: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as any);

    vi.mocked(prisma.pushNotificationLog.create).mockResolvedValue({} as any);
    vi.mocked(prisma.deviceToken.updateMany).mockResolvedValue({ count: 1 } as any);

    const results = await sendPushNotification({
      userId: 'user-1',
      title: 'Failed Alert',
      body: 'Error message',
    });

    expect(results[0].status).toBe('rejected');
    expect(prisma.pushNotificationLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        platform: 'web',
        deviceToken: 'invalid-token',
        status: 'failed',
      }),
    });
    expect(prisma.deviceToken.updateMany).toHaveBeenCalledWith({
      where: { token: 'invalid-token' },
      data: { isActive: false },
    });
  });
});

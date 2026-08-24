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

vi.mock('./env', () => {
  return {
    validateEnv: () => ({
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: undefined,
      FIREBASE_CLIENT_EMAIL: undefined,
      FIREBASE_PRIVATE_KEY: undefined,
      DESKTOP_NOTIFICATION_ENDPOINT: undefined,
    }),
  };
});

import { prisma } from '@repo/database';
import { sendPushNotification } from './push-notifications';

describe('sendPushNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('delivers notification to desktop device token successfully', async () => {
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

  it('delivers to multiple active devices for the user', async () => {
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
        token: 'desktop-token-2',
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
      title: 'Multi-device Alert',
      body: 'Broadcast message',
    });

    expect(results).toHaveLength(2);
    expect(results[0].status).toBe('fulfilled');
    expect(results[1].status).toBe('fulfilled');
    expect(prisma.pushNotificationLog.create).toHaveBeenCalledTimes(2);
  });
});

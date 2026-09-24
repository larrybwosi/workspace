import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendFcmPushNotification } from './fcm-provider';
import * as firebaseApp from 'firebase-admin/app';
import * as firebaseMessaging from 'firebase-admin/messaging';

vi.mock('firebase-admin/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
  cert: vi.fn((config) => config),
}));

vi.mock('firebase-admin/messaging', () => {
  const sendMock = vi.fn();
  return {
    getMessaging: vi.fn(() => ({
      send: sendMock,
    })),
  };
});

describe('fcm-provider', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns mock messageId when Firebase credentials are not configured', async () => {
    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    delete process.env.FIREBASE_CLIENT_EMAIL;
    delete process.env.FIREBASE_PRIVATE_KEY;

    const result = await sendFcmPushNotification({
      userId: 'user-1',
      deviceToken: 'token-123',
      platform: 'android',
      title: 'Test Title',
      body: 'Test Body',
      data: { type: 'direct_message', entityId: 'dm-123' },
    });

    expect(result).toEqual({
      success: true,
      messageId: 'fcm-not-configured-mock-id',
    });
  });

  it('sends message via Firebase Admin SDK when credentials are provided', async () => {
    process.env.FIREBASE_PROJECT_ID = 'test-proj';
    process.env.FIREBASE_CLIENT_EMAIL = 'test@proj.iam.gserviceaccount.com';
    process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\\nkey\\n-----END PRIVATE KEY-----\\n';

    const mockApp = {} as any;
    vi.mocked(firebaseApp.getApps).mockReturnValue([mockApp]);

    const messagingInstance = firebaseMessaging.getMessaging(mockApp);
    vi.mocked(messagingInstance.send).mockResolvedValue('msg-fcm-100');

    const result = await sendFcmPushNotification({
      userId: 'user-1',
      deviceToken: 'fcm-device-token-123',
      platform: 'android',
      title: 'Direct Message',
      body: 'Hello World',
      data: { type: 'direct_message', entityId: 'dm-456' },
      imageUrl: 'https://example.com/img.png',
      linkUrl: 'https://chat.scryme.tech/channels/@me/dm-456',
    });

    expect(result).toEqual({
      success: true,
      messageId: 'msg-fcm-100',
    });

    expect(messagingInstance.send).toHaveBeenCalledWith(
      expect.objectContaining({
        token: 'fcm-device-token-123',
        notification: {
          title: 'Direct Message',
          body: 'Hello World',
          imageUrl: 'https://example.com/img.png',
        },
        android: expect.objectContaining({
          priority: 'high',
          notification: expect.objectContaining({
            channelId: 'urgent',
            clickAction: 'OPEN_CHAT',
          }),
        }),
      })
    );
  });
});

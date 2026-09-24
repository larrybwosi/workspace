import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getMessaging, Message } from 'firebase-admin/messaging';
import {
  PlatformPushNotificationPayload,
  PushNotificationResult,
  registerPushNotificationProvider,
} from './push-notifications';

let firebaseApp: App | null = null;

export function getFirebaseAdminApp(): App | null {
  if (firebaseApp) {
    return firebaseApp;
  }

  const existingApps = getApps();
  if (existingApps.length > 0 && existingApps[0]) {
    firebaseApp = existingApps[0];
    return firebaseApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (projectId && clientEmail && privateKey) {
    try {
      firebaseApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      return firebaseApp;
    } catch (err) {
      console.error('Failed to initialize Firebase Admin SDK:', err);
      return null;
    }
  }

  return null;
}

export async function sendFcmPushNotification(
  payload: PlatformPushNotificationPayload
): Promise<PushNotificationResult> {
  const app = getFirebaseAdminApp();
  if (!app) {
    return {
      success: true,
      messageId: 'fcm-not-configured-mock-id',
    };
  }

  const { deviceToken, title, body, data = {}, imageUrl, linkUrl } = payload;

  const type = data.type || 'system';
  let channelId = 'normal';
  if (type === 'direct_message' || type === 'mention' || type === 'friend_request') {
    channelId = 'urgent';
  } else if (type === 'channel_alert') {
    channelId = 'high';
  }

  const stringifiedData: Record<string, string> = {
    title,
    body,
    channelId,
    ...Object.entries(data).reduce((acc, [k, v]) => {
      acc[k] = typeof v === 'string' ? v : String(v ?? '');
      return acc;
    }, {} as Record<string, string>),
  };

  if (imageUrl) stringifiedData.imageUrl = imageUrl;
  if (linkUrl) stringifiedData.linkUrl = linkUrl;

  const message: Message = {
    token: deviceToken,
    notification: {
      title,
      body,
      imageUrl: imageUrl || undefined,
    },
    data: stringifiedData,
    android: {
      priority: channelId === 'urgent' || channelId === 'high' ? 'high' : 'normal',
      notification: {
        channelId,
        title,
        body,
        imageUrl: imageUrl || undefined,
        sound: 'default',
        clickAction: 'OPEN_CHAT',
      },
    },
  };

  try {
    const messaging = getMessaging(app);
    const messageId = await messaging.send(message);
    return {
      success: true,
      messageId,
    };
  } catch (error: any) {
    if (
      error?.code === 'messaging/invalid-registration-token' ||
      error?.code === 'messaging/registration-token-not-registered'
    ) {
      error.deactivateToken = true;
    }
    throw error;
  }
}

// Auto-register default providers for android and web
registerPushNotificationProvider('android', sendFcmPushNotification);
registerPushNotificationProvider('web', sendFcmPushNotification);

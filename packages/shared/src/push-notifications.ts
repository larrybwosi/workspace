import { prisma } from '@repo/database';

export interface PushNotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  linkUrl?: string;
  notificationId?: string;
}

export interface PlatformPushNotificationPayload extends PushNotificationPayload {
  deviceToken: string;
  platform: string;
}

export interface PushNotificationResult {
  success: boolean;
  messageId?: string;
  result?: any;
}

export type PushNotificationProvider = (
  payload: PlatformPushNotificationPayload
) => Promise<PushNotificationResult>;

const providerRegistry = new Map<string, PushNotificationProvider>();

/**
 * Register a push notification provider handler for a specific platform (e.g. 'web', 'android', 'ios', 'desktop').
 */
export function registerPushNotificationProvider(platform: string, provider: PushNotificationProvider) {
  providerRegistry.set(platform, provider);
}

/**
 * Set or replace multiple platform push notification providers.
 */
export function setPushNotificationProviders(providers: Record<string, PushNotificationProvider>) {
  for (const [platform, provider] of Object.entries(providers)) {
    providerRegistry.set(platform, provider);
  }
}

/**
 * Remove a registered provider for a platform.
 */
export function unregisterPushNotificationProvider(platform: string) {
  providerRegistry.delete(platform);
}

/**
 * Clear all registered push notification providers.
 */
export function clearPushNotificationProviders() {
  providerRegistry.clear();
}

/**
 * Framework-agnostic dispatcher for sending push notifications across user devices.
 * Uses registered platform push providers and handles device token state and notification logging.
 */
export async function sendPushNotification(payload: PushNotificationPayload) {
  const { userId, title, body, data, imageUrl, linkUrl, notificationId } = payload;

  // Fetch all active device tokens for the user
  const deviceTokens = await prisma.deviceToken.findMany({
    where: {
      userId,
      isActive: true,
    },
  });

  if (deviceTokens.length === 0) {
    return [];
  }

  const results = await Promise.allSettled(
    deviceTokens.map(async device => {
      const provider = providerRegistry.get(device.platform);

      const platformPayload: PlatformPushNotificationPayload = {
        userId,
        title,
        body,
        data,
        imageUrl,
        linkUrl,
        notificationId,
        deviceToken: device.token,
        platform: device.platform,
      };

      try {
        let res: PushNotificationResult;
        if (provider) {
          res = await provider(platformPayload);
        } else {
          // Fallback log if no platform provider registered
          res = { success: true };
        }

        await prisma.pushNotificationLog.create({
          data: {
            userId,
            notificationId,
            platform: device.platform,
            deviceToken: device.token,
            title,
            body,
            data: data as any,
            status: 'sent',
          },
        });

        return res;
      } catch (error: any) {
        await prisma.pushNotificationLog.create({
          data: {
            userId,
            notificationId,
            platform: device.platform,
            deviceToken: device.token,
            title,
            body,
            data: data as any,
            status: 'failed',
            error: error?.message || String(error),
          },
        });

        // Deactivate token on invalid/unregistered token errors
        if (
          error?.deactivateToken ||
          error?.code === 'messaging/invalid-registration-token' ||
          error?.code === 'messaging/registration-token-not-registered' ||
          error?.message?.includes('DeviceNotRegistered') ||
          error?.message?.includes('InvalidCredentials')
        ) {
          await prisma.deviceToken.updateMany({
            where: { token: device.token },
            data: { isActive: false },
          });
        }

        throw error;
      }
    })
  );

  return results;
}

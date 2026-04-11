'use client';

import { useEffect, useState } from 'react';
import { getFirebaseToken, onMessageListener } from '@/lib/integrations/firebase-config';
import { useUpdateUserDeviceToken } from '@repo/api-client';
import { toast } from 'sonner';

/**
 * Hook to manage PWA & Firebase Push Notifications
 */
export function usePushNotifications() {
  const [token, setToken] = useState<string | null>(null);
  const updateUserDeviceToken = useUpdateUserDeviceToken();

  useEffect(() => {
    async function setupNotifications() {
      if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('Notification' in window)) {
        return;
      }

      try {
        const fcmToken = await getFirebaseToken();
        if (fcmToken) {
          setToken(fcmToken);
          // Register token with backend
          updateUserDeviceToken.mutate({
            token: fcmToken,
            platform: 'web',
            deviceName: navigator.userAgent
          });
        }
      } catch (error) {
        console.error('Failed to setup push notifications:', error);
      }
    }

    setupNotifications();
  }, []);

  useEffect(() => {
    // Listen for foreground messages
    const unsubscribe = onMessageListener()
      .then((payload: any) => {
        console.log('Foreground message received:', payload);
        toast(payload.notification?.title || 'New Notification', {
          description: payload.notification?.body,
        });
      })
      .catch((err) => console.log('failed: ', err));

    return () => {
      // FCM onMessage doesn't return an unsubscribe function in the way we've wrapped it,
      // but in a real app we'd handle cleanup here.
    };
  }, []);

  return { token };
}

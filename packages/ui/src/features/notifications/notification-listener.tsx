'use client';

import { useEffect, useCallback } from 'react';
import { realtime, AblyChannels, AblyEvents } from '@repo/shared';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { showDiscordNotification, playNotificationSound } from './custom-toasts/notification-utils';
import { useSession } from '@repo/shared';
import { useNotifications } from '@repo/api-client';

// Tauri specific imports
const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__;

export function NotificationListener() {
  const { data: session } = useSession() as any;
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();

  // Pre-load Tauri modules for efficiency
  useEffect(() => {
    if (isTauri) {
      // Warm up the imports
      const pluginNotification = '@tauri-apps/plugin-notification';
      const apiWebviewWindow = '@tauri-apps/api/webviewWindow';
      const apiCore = '@tauri-apps/api/core';
      // @ts-ignore
      import(/* @vite-ignore */ pluginNotification);
      // @ts-ignore
      import(/* @vite-ignore */ apiWebviewWindow);
      // @ts-ignore
      import(/* @vite-ignore */ apiCore);
    }
  }, []);

  // Handle native notification clicks once
  useEffect(() => {
    if (!isTauri) return;

    const setupClickhandler = async () => {
      const pluginNotification = '@tauri-apps/plugin-notification';
      const apiWebviewWindow = '@tauri-apps/api/webviewWindow';
      // @ts-ignore
      const { onNotificationClick } = await import(/* @vite-ignore */ pluginNotification);
      // @ts-ignore
      const { getCurrentWebviewWindow } = await import(/* @vite-ignore */ apiWebviewWindow);

      onNotificationClick((event: any) => {
        const window = getCurrentWebviewWindow();
        window.show();
        window.setFocus();
        if (event.notification.extra?.linkUrl) {
          router.push(event.notification.extra.linkUrl as string);
        }
      });
    };

    setupClickhandler();
  }, [router]);

  // Track "active" context to suppress notifications
  // Format depends on how the app is structured (e.g., workspaceSlug, channelSlug)
  const activeWorkspace = params.slug as string;
  const activeChannel = (params.channelId as string) || (params.channelSlug as string);

  const handleNotification = useCallback(
    (message: any) => {
      const notification = message.data;

      // Suppression Logic:
      // If the notification is for a channel the user is currently in, don't show it.
      if (notification.entityType === 'channel' && notification.entityId === activeChannel) {
        return;
      }

      // Sound effects logic
      if (notification.type === 'mention') {
        playNotificationSound('mention');
      } else if (notification.title.toLowerCase().includes('call')) {
        playNotificationSound('call');
      } else {
        playNotificationSound('message');
      }

      // Show Native Desktop Notification if in Tauri
      if (isTauri) {
        const pluginNotification = '@tauri-apps/plugin-notification';
        // @ts-ignore
        import(/* @vite-ignore */ pluginNotification).then(({ isPermissionGranted, requestPermission, sendNotification }: any) => {
          const handleNativeNotification = async () => {
            let permissionGranted = await isPermissionGranted();
            if (!permissionGranted) {
              const permission = await requestPermission();
              permissionGranted = permission === 'granted';
            }
            if (permissionGranted) {
              sendNotification({
                title: notification.title,
                body: notification.message,
                extra: { linkUrl: notification.linkUrl }
              });
            }
          };
          handleNativeNotification();
        });
      }

      // Show Custom Toast
      showDiscordNotification({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        avatar: notification.metadata?.avatar || notification.avatar,
        entityType: notification.entityType,
        entityId: notification.entityId,
        linkUrl: notification.linkUrl,
        type: notification.type,
      });
    },
    [activeChannel, router]
  );

  // Badge count logic for Tauri
  const { data: unreadNotifications } = useNotifications(true);

  useEffect(() => {
    if (isTauri && unreadNotifications) {
      const apiCore = '@tauri-apps/api/core';
      // @ts-ignore
      import(/* @vite-ignore */ apiCore).then(({ invoke }: any) => {
        invoke('set_badge_count', { count: unreadNotifications.length });
      });
    }
  }, [unreadNotifications]);

  useEffect(() => {
    if (!session?.user?.id) return;

    const channelName = AblyChannels.notifications(session.user.id);
    realtime.subscribe(channelName, AblyEvents.NOTIFICATION, handleNotification);

    return () => {
      realtime.unsubscribe(channelName, AblyEvents.NOTIFICATION, handleNotification);
    };
  }, [session?.user?.id, handleNotification]);

  return null;
}

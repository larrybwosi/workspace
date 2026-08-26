'use client';

import { useEffect, useCallback } from 'react';
import { realtime, AblyChannels, AblyEvents } from '@repo/shared';
import { useParams, usePathname } from 'next/navigation';
import { showDiscordNotification, playNotificationSound } from './custom-toasts/notification-utils';
import { useSession } from '@repo/shared';

export function NotificationListener() {
  const { data: session } = useSession() as any;
  const params = useParams();
  const pathname = usePathname();

  // Track "active" context to suppress notifications
  // Format depends on how the app is structured (e.g., workspaceSlug, channelSlug)
  const activeWorkspace = params.slug as string;
  const activeChannel = (params.channelId as string) || (params.channelSlug as string);

  const handleNotification = useCallback(
    (payload: any) => {
      const notification = payload?.data || payload;

      // Suppression Logic:
      // If the notification is for a channel the user is currently in, don't show it.
      if (notification.entityType === 'channel' && notification.entityId === activeChannel) {
        return;
      }

      // Sound effects logic
      if (notification.type === 'mention') {
        playNotificationSound('mention');
      } else if (notification.title?.toLowerCase().includes('call')) {
        playNotificationSound('call');
      } else {
        playNotificationSound('message');
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

      // Trigger OS web browser notification (when document is in background)
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        if (document.hidden) {
          try {
            new Notification(notification.title || 'New Notification', {
              body: notification.message || '',
              icon: '/icon-192.png',
            });
          } catch (e) {
            console.warn('Browser Notification construction failed:', e);
          }
        }
      }
    },
    [activeChannel]
  );

  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = AblyChannels.notifications(session.user.id);
    realtime.subscribe(channel, AblyEvents.NOTIFICATION, handleNotification);
    realtime.subscribe(channel, 'notification:new', handleNotification);

    return () => {
      realtime.unsubscribe(channel, AblyEvents.NOTIFICATION, handleNotification);
      realtime.unsubscribe(channel, 'notification:new', handleNotification);
    };
  }, [session?.user?.id, handleNotification]);

  return null;
}

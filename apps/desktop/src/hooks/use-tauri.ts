import { useEffect, useCallback } from 'react';
import { onOpenUrl } from '@tauri-apps/plugin-deep-link';
import { useNavigate } from 'react-router';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import { realtime, AblyChannels, AblyEvents } from '@repo/shared';
import { useSession } from '../lib/auth/auth-client';

export function useTauri() {
  const navigate = useNavigate();
  const { data: session } = useSession() as any;

  const notify = useCallback(async (title: string, body: string) => {
    try {
      let permissionGranted = await isPermissionGranted();
      if (!permissionGranted) {
        const permission = await requestPermission();
        permissionGranted = permission === 'granted';
      }
      if (permissionGranted) {
        sendNotification({ title, body });
      }
    } catch (e) {
      console.warn('Tauri sendNotification failed:', e);
    }
  }, []);

  useEffect(() => {
    let unlisten: any;

    async function setupDeepLinks() {
      try {
        unlisten = await onOpenUrl(urls => {
          console.log('Opened URLs:', urls);
          for (const url of urls) {
            try {
              // Example: workspace://workspace/slug/channels/channelSlug
              // or workspace://dm/userId
              const path = url.replace('workspace://', '/');
              navigate(path);
            } catch (e) {
              console.error('Failed to parse deep link URL', e);
            }
          }
        });
      } catch (e) {
        console.warn('Failed to set up Tauri deep links:', e);
      }
    }

    setupDeepLinks();

    return () => {
      if (unlisten) unlisten();
    };
  }, [navigate]);

  useEffect(() => {
    if (!session?.user?.id) return;

    const handleNotification = (payload: any) => {
      const notification = payload?.data || payload;
      notify(
        notification.title || 'New Notification',
        notification.message || notification.body || ''
      );
    };

    const channel = AblyChannels.notifications(session.user.id);
    realtime.subscribe(channel, AblyEvents.NOTIFICATION, handleNotification);
    realtime.subscribe(channel, 'notification:new', handleNotification);

    return () => {
      realtime.unsubscribe(channel, AblyEvents.NOTIFICATION, handleNotification);
      realtime.unsubscribe(channel, 'notification:new', handleNotification);
    };
  }, [session?.user?.id, notify]);

  return { notify };
}

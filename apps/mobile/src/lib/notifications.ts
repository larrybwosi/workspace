import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import axios from 'axios';
import { getBaseURL } from './env';

export async function setupNotifications() {
  if (Platform.OS === 'web') return;

  await Notifications.setNotificationCategoryAsync('INCOMING_CALL', [
    {
      identifier: 'ACCEPT_CALL',
      buttonTitle: 'Accept',
      options: { opensAppToForeground: true },
    },
    {
      identifier: 'REJECT_CALL',
      buttonTitle: 'Decline',
      options: { isDestructive: true },
    },
  ]);

  await Notifications.setNotificationCategoryAsync('MESSAGE_REPLY', [
    {
      identifier: 'REPLY_ACTION',
      buttonTitle: 'Reply',
      textInput: {
        submitButtonTitle: 'Send',
        placeholder: 'Type your message...',
      },
      options: { opensAppToForeground: false },
    },
  ]);

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function handleNotificationResponse(response: Notifications.NotificationResponse, router: any) {
  const data = response.notification.request.content.data as any;
  const { type, entityId, linkUrl } = data || {};

  // Handle Reply Action
  if (response.actionIdentifier === 'REPLY_ACTION') {
    const userText = (response as any).userText;
    if (userText && entityId) {
      try {
        const baseURL = getBaseURL();
        if (type === 'direct_message') {
          await axios.post(`${baseURL}/api/dms/${entityId}/messages`, { content: userText });
        } else {
          await axios.post(`${baseURL}/api/workspaces/messages`, { channelId: entityId, content: userText });
        }
      } catch (e) {
        console.error('Failed to send reply from notification:', e);
      }
    }
    return;
  }

  if (linkUrl) {
    // If we have a direct linkUrl, use it (might need transformation for expo-router)
    router.push(linkUrl);
    return;
  }

  switch (type) {
    case 'direct_message':
      if (entityId) {
        router.push({ pathname: '/chat/[id]', params: { id: entityId } });
      }
      break;
    case 'mention':
    case 'channel_alert':
      if (entityId) {
        router.push({ pathname: '/chat/[id]', params: { id: entityId } });
      }
      break;
    default:
      console.log('Unknown notification type:', type);
  }
}

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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

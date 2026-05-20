import { useEffect } from 'react';
import { realtime, AblyChannels, useCallStore } from '@repo/shared';
import { useSession } from '../lib/auth';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export function useCallSignaling() {
  const { data: session } = useSession();
  const { setIncoming, endCall, rejectCall, activeCall } = useCallStore();

  useEffect(() => {
    if (!session?.user?.id) return;

    const userChannel = AblyChannels.user(session.user.id);

    const handleIncomingCall = (data: any) => {
      console.log('Incoming call signal:', data);

      setIncoming({
        callId: data.callId,
        type: data.type || 'voice',
        initiator: data.initiator,
        workspaceId: data.workspaceId,
        workspaceSlug: data.workspaceSlug,
      });

      if (Platform.OS !== 'web') {
        Notifications.scheduleNotificationAsync({
          content: {
            title: `Incoming ${data.type || 'voice'} call`,
            body: `${data.initiator.name} is calling you`,
            data: { callId: data.callId, type: data.type },
            categoryIdentifier: 'INCOMING_CALL',
          },
          trigger: null,
        });
      }
    };

    const handleCallEnded = (data: any) => {
      if (activeCall?.callId === data.callId) {
        endCall();
      }
      rejectCall();
    };

    realtime.subscribe(userChannel, 'incoming-call', handleIncomingCall);
    realtime.subscribe(userChannel, 'call-ended', handleCallEnded);

    return () => {
      realtime.unsubscribe(userChannel, 'incoming-call', handleIncomingCall);
      realtime.unsubscribe(userChannel, 'call-ended', handleCallEnded);
    };
  }, [session?.user?.id, activeCall?.callId]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const { actionIdentifier,  } = response;
      // const data = notification.request.content.data;

      if (actionIdentifier === 'ACCEPT_CALL') {
        // Logic will be handled by the UI overlay which also sees the store update
      } else if (actionIdentifier === 'REJECT_CALL') {
        rejectCall();
      }
    });

    return () => subscription.remove();
  }, []);
}

import { AblyChannels, AblyEvents, publishToAbly as publishToAblyServer } from './ably.server';
import { validateEnv } from './env';

export interface RealtimeProvider {
  publish(channel: string, event: string, data: any): Promise<void>;
}

let socketioProvider: RealtimeProvider | null = null;

export function setSocketioProvider(provider: RealtimeProvider) {
  socketioProvider = provider;
}

export async function publishRealtime(channel: string, event: string, data: any) {
  const env = validateEnv();
  const provider = env.REALTIME_PROVIDER;

  // For debugging
  // console.log(`[Realtime] Publishing to ${channel} (event: ${event}) via ${provider}`);

  if (provider === 'socketio') {
    if (!socketioProvider) {
      console.warn('Socket.io provider requested but not initialized');
      return;
    }
    await socketioProvider.publish(channel, event, data);
  } else {
    await publishToAblyServer(channel, event, data);
  }
}

// Backward compatibility and helper functions
export async function sendRealtimeMessage(channel: string, event: string, data: any) {
  return publishRealtime(channel, event, data);
}

export async function publishToAbly(channel: string, event: string, data: any) {
  return publishRealtime(channel, event, data);
}

export { AblyChannels, AblyEvents };

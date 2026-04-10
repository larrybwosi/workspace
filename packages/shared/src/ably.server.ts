import * as Ably from 'ably';
import { AblyChannels, AblyEvents } from './ably';

// Singleton pattern for Ably client on server
let ablyClientInstance: any = null;

export function getAblyServer() {
  const key = process.env.ABLY_API_KEY
  if (!key) {
    console.warn("ABLY_API_KEY is not defined")
    return null
  }
  if (!ablyClientInstance) {
    // @ts-ignore
    ablyClientInstance = new Ably.Realtime({
      key,
      clientId: "server",
    })
  }
  return ablyClientInstance;
}

export function getAblyRest() {
  const key = process.env.ABLY_API_KEY
  if (!key) {
    console.warn('ABLY_API_KEY is not defined, returning null');
    return null;
  }
  // @ts-ignore
  return new Ably.Rest({
    key,
  });
}

export async function publishMessage(channelId: string, data: any) {
  try {
    const ably = getAblyRest();
    if (!ably) return;
    const channel = (ably as any).channels.get(AblyChannels.channel(channelId));
    await channel.publish(data.type, data.data);
  } catch (error) {
    console.error(' Error publishing message to Ably:', error);
    throw error;
  }
}

export async function publishNotification(userId: string, notification: any) {
  try {
    const ably = getAblyRest();
    if (!ably) return;
    const channel = (ably as any).channels.get(AblyChannels.notifications(userId));
    await channel.publish(AblyEvents.NOTIFICATION, notification);
  } catch (error) {
    console.error(' Error publishing notification to Ably:', error);
    throw error;
  }
}

export async function publishToAbly(channelName: string, eventName: string, data: any, retries = 3) {
  try {
    const ably = getAblyRest();
    if (!ably) return;
    const channel = (ably as any).channels.get(channelName);
    await channel.publish(eventName, data);
  } catch (error) {
    if (retries > 0) {
      console.warn(`Retrying Ably publish to ${channelName} (${eventName}). Retries left: ${retries - 1}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return publishToAbly(channelName, eventName, data, retries - 1);
    }
    console.error(' Error publishing to Ably after retries:', error);
    throw error;
  }
}

export async function sendRealtimeMessage(channelName: string, eventName: string, data: any) {
  return publishToAbly(channelName, eventName, data);
}

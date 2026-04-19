import { io, Socket } from 'socket.io-client';
import { getAblyClient, AblyChannels, AblyEvents } from './ably';
import { validateEnv } from './env';

export interface RealtimeClient {
  subscribe(channel: string, event: string, callback: (data: any) => void): void;
  unsubscribe(channel: string, event: string, callback: (data: any) => void): void;
  publish(channel: string, event: string, data: any): void;
}

let socketioClient: Socket | null = null;
let providerType: 'ably' | 'socketio' | null = null;

async function fetchProviderType() {
  if (providerType) return providerType;

  try {
    const env = validateEnv();
    const baseURL = env.NEXT_PUBLIC_API_URL;
    const response = await fetch(`${baseURL}/api/config/realtime`);
    const data = await response.json();
    providerType = data.provider;
  } catch (error) {
    console.error('Failed to fetch realtime provider type, defaulting to ably', error);
    providerType = 'ably';
  }
  return providerType;
}

function getSocketioClient() {
  if (typeof window === 'undefined') return null;

  if (!socketioClient) {
    const env = validateEnv();
    const baseURL = env.NEXT_PUBLIC_API_URL;
    socketioClient = io(baseURL, {
      withCredentials: true,
      autoConnect: true,
    });
  }
  return socketioClient;
}

export const realtime = {
  async subscribe(channelName: string, eventName: string, callback: (data: any) => void) {
    const type = await fetchProviderType();

    if (type === 'socketio') {
      const socket = getSocketioClient();
      if (!socket) return;
      socket.emit('join-room', channelName);

      const listener = (data: any) => {
        // Socket.io emits to rooms, but client-side listeners are global per socket.
        // We should ensure the message was intended for this channel.
        if (data?._channel && data._channel !== channelName) return;
        callback(data);
      };

      // Store the listener on the callback for later removal
      // We use a Map to handle same callback on different channels
      if (!(callback as any)._socketioListeners) {
        (callback as any)._socketioListeners = new Map<string, (data: any) => void>();
      }
      (callback as any)._socketioListeners.set(`${channelName}:${eventName}`, listener);

      socket.on(eventName, listener);
    } else {
      const ably = getAblyClient();
      if (!ably) return;
      const channel = ably.channels.get(channelName);

      const listener = (message: any) => {
        callback(message.data);
      };
      // Store for unsubscription
      if (!(callback as any)._ablyListeners) {
        (callback as any)._ablyListeners = new Map<string, (message: any) => void>();
      }
      (callback as any)._ablyListeners.set(`${channelName}:${eventName}`, listener);

      channel.subscribe(eventName, listener);
    }
  },

  async unsubscribe(channelName: string, eventName: string, callback: (data: any) => void) {
    const type = await fetchProviderType();

    if (type === 'socketio') {
      const socket = getSocketioClient();
      if (!socket) return;
      const listeners = (callback as any)._socketioListeners;
      const listener = listeners?.get(`${channelName}:${eventName}`);
      if (listener) {
        socket.off(eventName, listener);
        listeners.delete(`${channelName}:${eventName}`);
        // TODO: Could emit 'leave-room' if no more listeners for this channel
      }
    } else {
      const ably = getAblyClient();
      if (!ably) return;
      const channel = ably.channels.get(channelName);
      const listeners = (callback as any)._ablyListeners;
      const listener = listeners?.get(`${channelName}:${eventName}`);
      if (listener) {
        channel.unsubscribe(eventName, listener);
        listeners.delete(`${channelName}:${eventName}`);
      }
    }
  },

  async publish(channelName: string, eventName: string, data: any) {
    const type = await fetchProviderType();

    if (type === 'socketio') {
      const socket = getSocketioClient();
      if (!socket) return;
      socket.emit('publish', { channel: channelName, event: eventName, data });
    } else {
      const ably = getAblyClient();
      if (!ably) return;
      const channel = ably.channels.get(channelName);
      channel.publish(eventName, data);
    }
  },

  async enterPresence(channelName: string, userId: string, data: any = {}) {
    const type = await fetchProviderType();
    if (type === 'socketio') {
      const socket = getSocketioClient();
      if (!socket) return;
      socket.emit('enter-presence', { channel: channelName, userId, data });
    } else {
      const ably = getAblyClient();
      if (!ably) return;
      const channel = ably.channels.get(channelName);
      channel.presence.enterClient(userId, data);
    }
  },

  async leavePresence(channelName: string, userId: string) {
    const type = await fetchProviderType();
    if (type === 'socketio') {
      const socket = getSocketioClient();
      if (!socket) return;
      socket.emit('leave-presence', { channel: channelName, userId });
    } else {
      const ably = getAblyClient();
      if (!ably) return;
      const channel = ably.channels.get(channelName);
      channel.presence.leaveClient(userId);
    }
  }
};

export { AblyChannels, AblyEvents };

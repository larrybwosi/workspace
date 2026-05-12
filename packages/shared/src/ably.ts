import * as Ably from 'ably';

// Channel naming conventions
export const AblyChannels = {
  channel: (channelId: string) => `channel:${channelId}`,
  thread: (threadId: string) => `thread:${threadId}`,
  user: (userId: string) => `user:${userId}`,
  notifications: (userId: string) => `notifications:${userId}`,
  presence: (channelId: string) => `presence:${channelId}`,
  dm: (dmId: string) => `dm:${dmId}`,
  workspace: (workspaceId: string) => `workspace:${workspaceId}`,
  call: (callId: string) => `call:${callId}`,
};

// Event types
export const AblyEvents = {
  MESSAGE_SENT: 'message:sent',
  MESSAGE_UPDATED: 'message:updated',
  MESSAGE_DELETED: 'message:deleted',
  MESSAGE_REACTION: 'message:reaction',
  MESSAGE_REPLY: 'message:reply',
  MESSAGE_READ: 'message:read',
  NOTIFICATION: 'notification',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  USER_JOINED: 'user:joined',
  USER_LEFT: 'user:left',
  DM_RECEIVED: 'dm:received',
  WORKSPACE_UPDATED: 'workspace:updated',
  CHANNEL_CREATED: 'channel:created',
  CHANNEL_UPDATED: 'channel:updated',
  CHANNEL_DELETED: 'channel:deleted',
  SOUNDBOARD_PLAYED: 'soundboard:played',
};

export const EVENTS = AblyEvents;

// Helper to safely access env variables across Vite, Next.js and React Native
const getEnv = (name: string) => {
  const g = globalThis as any;
  const env = g.process?.env || g.import?.meta?.env || g.__env__;
  if (!env) return undefined;
  return (
    env[name] || env[`VITE_${name}`] || env[`NEXT_PUBLIC_${name}`] || env[`EXPO_PUBLIC_${name}`] || env[`TAURI_${name}`]
  );
};

// Singleton pattern for Ably client
let ablyClientInstance: any = null;

export function getAblyClient() {
  if (typeof window === 'undefined') {
    return null;
  } else {
    // Client-side
    if (!ablyClientInstance) {
      const baseURL =
        getEnv('API_URL') ||
        getEnv('NEXT_PUBLIC_API_URL') ||
        getEnv('VITE_API_URL') ||
        getEnv('EXPO_PUBLIC_API_URL') ||
        '';

      // @ts-ignore
      ablyClientInstance = new Ably.Realtime({
        authUrl: `${baseURL.replace(/\/$/, '')}/api/ably/token`,
        authMethod: 'POST',
      });
    }
  }
  return ablyClientInstance;
}

// Lazy load ably instance to avoid build-time errors
export const ably = {
  get auth() {
    const client = getAblyClient();
    if (!client) throw new Error('Ably client not initialized');
    return client.auth;
  },
  get channels() {
    const client = getAblyClient();
    if (!client) throw new Error('Ably client not initialized');
    return client.channels;
  },
} as any;

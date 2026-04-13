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

// Singleton pattern for Ably client
let ablyClientInstance: any = null;

export function getAblyClient() {
  if (typeof window === "undefined") {
    // This part should technically be in ably.server.ts if we want strictly separated code,
    // but for now, we'll keep it here for compatibility if needed,
    // or just make it return null/throw if we want strict client-only in this file.
    // However, some "universal" code might still use it.

    // Better to keep it minimal and let server use ably.server.ts
    return null;
  } else {
    // Client-side
    if (!ablyClientInstance) {
      const getBaseURL = () => {
        if (typeof process !== 'undefined' && process.env) {
          if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
          if ((process.env as any).EXPO_PUBLIC_API_URL) return (process.env as any).EXPO_PUBLIC_API_URL;
        }
        return '';
      };

      const baseURL = getBaseURL();

      // @ts-ignore
      ablyClientInstance = new Ably.Realtime({
        authUrl: `${baseURL}/api/ably/token`,
        authMethod: "POST",
      })
    }
  }
  return ablyClientInstance;
}

// Lazy load ably instance to avoid build-time errors
export const ably = {
  get auth() {
    const client = getAblyClient()
    if (!client) throw new Error("Ably client not initialized")
    return client.auth
  },
  get channels() {
    const client = getAblyClient()
    if (!client) throw new Error("Ably client not initialized")
    return client.channels
  }
} as any

import * as Ably from "ably"

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
}

// Event types
export const AblyEvents = {
  MESSAGE_SENT: "message:sent",
  MESSAGE_UPDATED: "message:updated",
  MESSAGE_DELETED: "message:deleted",
  MESSAGE_REACTION: "message:reaction",
  MESSAGE_REPLY: "message:reply",
  NOTIFICATION: "notification",
  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",
  USER_JOINED: "user:joined",
  USER_LEFT: "user:left",
  DM_RECEIVED: "dm:received",
  WORKSPACE_UPDATED: "workspace:updated",
  CHANNEL_CREATED: "channel:created",
  CHANNEL_UPDATED: "channel:updated",
  CHANNEL_DELETED: "channel:deleted",
  SOUNDBOARD_PLAYED: "soundboard:played",
}

export const EVENTS = AblyEvents

// Singleton pattern for Ably client
let ablyClientInstance: any = null

export function getAblyClient() {
  if (typeof window === "undefined") {
    // Server-side
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
  } else {
    // Client-side
    if (!ablyClientInstance) {
      // @ts-ignore
      ablyClientInstance = new Ably.Realtime({
        authUrl: "/api/ably/token",
        authMethod: "POST",
      })
    }
  }
  return ablyClientInstance
}

export function getAblyServer() {
  return getAblyClient()
}

export function getAblyRest() {
  if (typeof window !== "undefined") {
    throw new Error("getAblyRest should only be called on the server")
  }
  const key = process.env.ABLY_API_KEY
  if (!key) {
    console.warn("ABLY_API_KEY is not defined, returning null")
    return null
  }
  // @ts-ignore
  return new Ably.Rest({
    key,
  })
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

export async function publishMessage(channelId: string, data: any) {
  try {
    const ably = getAblyRest()
    if (!ably) return
    const channel = (ably as any).channels.get(AblyChannels.channel(channelId))
    await channel.publish(data.type, data.data)
  } catch (error) {
    console.error(" Error publishing message to Ably:", error)
    throw error
  }
}

export async function publishNotification(userId: string, notification: any) {
  try {
    const ably = getAblyRest()
    if (!ably) return
    const channel = (ably as any).channels.get(AblyChannels.notifications(userId))
    await channel.publish(AblyEvents.NOTIFICATION, notification)
  } catch (error) {
    console.error(" Error publishing notification to Ably:", error)
    throw error
  }
}

export async function publishToAbly(channelName: string, eventName: string, data: any) {
  try {
    const ably = getAblyRest()
    if (!ably) return
    const channel = (ably as any).channels.get(channelName)
    await channel.publish(eventName, data)
  } catch (error) {
    console.error(" Error publishing to Ably:", error)
    throw error
  }
}

export async function sendRealtimeMessage(channelName: string, eventName: string, data: any) {
  return publishToAbly(channelName, eventName, data)
}

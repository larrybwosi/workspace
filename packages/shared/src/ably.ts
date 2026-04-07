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

export function getAblyRest() {
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

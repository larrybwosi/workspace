import Ably from "ably"

// Singleton pattern for Ably client
let ablyClientInstance: Ably.Realtime | null = null

export function getAblyClient() {
  if (!ablyClientInstance) {
    ablyClientInstance = new Ably.Realtime({
      key: process.env.ABLY_API_KEY,
      clientId: "server",
    })
  }
  return ablyClientInstance
}

export function getAblyRest() {
  return new Ably.Rest({
    key: process.env.ABLY_API_KEY,
  })
}

// Channel naming conventions
export const AblyChannels = {
  channel: (channelId: string) => `channel:${channelId}`,
  thread: (threadId: string) => `thread:${threadId}`,
  project: (projectId: string) => `project:${projectId}`,
  user: (userId: string) => `user:${userId}`,
  notifications: (userId: string) => `notifications:${userId}`,
  presence: (channelId: string) => `presence:${channelId}`,
  dm: (dmId: string) => `dm:${dmId}`, // Added DM channel naming
}

// Event types
export const AblyEvents = {
  MESSAGE_SENT: "message:sent",
  MESSAGE_UPDATED: "message:updated",
  MESSAGE_DELETED: "message:deleted",
  MESSAGE_REACTION: "message:reaction",
  TASK_CREATED: "task:created",
  TASK_UPDATED: "task:updated",
  PROJECT_MEMBER_ADDED: "project:member:added",
  NOTE_SHARED: "note:shared",
  NOTIFICATION: "notification",
  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",
  USER_JOINED: "user:joined",
  USER_LEFT: "user:left",
  DM_RECEIVED: "dm:received", // Added DM received event
}

export async function publishMessage(channelId: string, data: any) {
  try {
    const ably = getAblyRest()
    const channel = ably.channels.get(AblyChannels.channel(channelId))
    await channel.publish(data.type, data.data)
  } catch (error) {
    console.error(" Error publishing message to Ably:", error)
    throw error
  }
}

export async function publishNotification(userId: string, notification: any) {
  try {
    const ably = getAblyRest()
    const channel = ably.channels.get(AblyChannels.notifications(userId))
    await channel.publish(AblyEvents.NOTIFICATION, notification)
  } catch (error) {
    console.error(" Error publishing notification to Ably:", error)
    throw error
  }
}

export async function publishToAbly(channelName: string, eventName: string, data: any) {
  try {
    const ably = getAblyRest()
    const channel = ably.channels.get(channelName)
    await channel.publish(eventName, data)
  } catch (error) {
    console.error(" Error publishing to Ably:", error)
    throw error
  }
}

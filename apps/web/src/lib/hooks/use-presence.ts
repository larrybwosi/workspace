"use client"

import { useEffect, useState } from "react"
import { getAblyClient } from "@repo/shared"

const PRESENCE_CHANNEL = "global-presence"

export function usePresence() {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const ably = getAblyClient()

  useEffect(() => {
    if (!ably) return

    const channel = ably.channels.get(PRESENCE_CHANNEL)

    const updatePresence = async () => {
      const presenceMessages = await channel.presence.get()
      const userIds = presenceMessages.map((msg: any) => msg.clientId)
      setOnlineUsers(new Set(userIds))
    }

    channel.presence.subscribe("enter", (member: any) => {
      setOnlineUsers((prev) => new Set([...prev, member.clientId]))
    })

    channel.presence.subscribe("leave", (member: any) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev)
        next.delete(member.clientId)
        return next
      })
    })

    updatePresence()

    return () => {
      channel.presence.unsubscribe()
    }
  }, [ably])

  return onlineUsers
}

export function PresenceManager({ userId }: { userId?: string }) {
  const ably = getAblyClient()

  useEffect(() => {
    if (!ably || !userId) return

    const channel = ably.channels.get(PRESENCE_CHANNEL)

    channel.presence.enterClient(userId, { status: "online" })

    return () => {
      channel.presence.leaveClient(userId)
    }
  }, [ably, userId])

  return null
}

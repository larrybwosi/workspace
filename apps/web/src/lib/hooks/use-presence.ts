"use client"

import { useEffect, useState } from "react"
import { realtime } from "@repo/shared"

const PRESENCE_CHANNEL = "global-presence"

export function usePresence() {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())

  useEffect(() => {
    const handleEnter = (member: any) => {
      setOnlineUsers((prev) => new Set([...prev, member.userId || member.clientId]))
    }

    const handleLeave = (member: any) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev)
        next.delete(member.userId || member.clientId)
        return next
      })
    }

    realtime.subscribe(PRESENCE_CHANNEL, "presence:enter", handleEnter)
    realtime.subscribe(PRESENCE_CHANNEL, "presence:leave", handleLeave)
    // Ably compatibility
    realtime.subscribe(PRESENCE_CHANNEL, "enter", handleEnter)
    realtime.subscribe(PRESENCE_CHANNEL, "leave", handleLeave)

    return () => {
      realtime.unsubscribe(PRESENCE_CHANNEL, "presence:enter", handleEnter)
      realtime.unsubscribe(PRESENCE_CHANNEL, "presence:leave", handleLeave)
      realtime.unsubscribe(PRESENCE_CHANNEL, "enter", handleEnter)
      realtime.unsubscribe(PRESENCE_CHANNEL, "leave", handleLeave)
    }
  }, [])

  return onlineUsers
}

export function PresenceManager({ userId }: { userId?: string }) {
  useEffect(() => {
    if (!userId) return

    realtime.enterPresence(PRESENCE_CHANNEL, userId, { status: "online" })

    return () => {
      realtime.leavePresence(PRESENCE_CHANNEL, userId)
    }
  }, [userId])

  return null
}

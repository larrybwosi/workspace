"use client"

import { useEffect, useState, createContext, useContext } from "react"
import { realtime } from "@repo/shared"

const PRESENCE_CHANNEL = "global-presence"

interface PresenceContextType {
  onlineUsers: Set<string>
}

const PresenceContext = createContext<PresenceContextType>({ onlineUsers: new Set() })

export function PresenceProvider({ children, userId }: { children: React.ReactNode, userId?: string }) {
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

    if (userId) {
      realtime.enterPresence(PRESENCE_CHANNEL, userId, { status: "online" })
    }

    realtime.subscribe(PRESENCE_CHANNEL, "presence:enter", handleEnter)
    realtime.subscribe(PRESENCE_CHANNEL, "presence:leave", handleLeave)
    realtime.subscribe(PRESENCE_CHANNEL, "enter", handleEnter)
    realtime.subscribe(PRESENCE_CHANNEL, "leave", handleLeave)

    return () => {
      realtime.unsubscribe(PRESENCE_CHANNEL, "presence:enter", handleEnter)
      realtime.unsubscribe(PRESENCE_CHANNEL, "presence:leave", handleLeave)
      realtime.unsubscribe(PRESENCE_CHANNEL, "enter", handleEnter)
      realtime.unsubscribe(PRESENCE_CHANNEL, "leave", handleLeave)
      if (userId) {
        realtime.leavePresence(PRESENCE_CHANNEL, userId)
      }
    }
  }, [userId])

  return (
    <PresenceContext.Provider value={{ onlineUsers }}>
      {children}
    </PresenceContext.Provider>
  )
}

export const usePresence = () => useContext(PresenceContext)

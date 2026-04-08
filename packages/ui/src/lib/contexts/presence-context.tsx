"use client"

import { useEffect, useState, createContext, useContext } from "react"
import { getAblyClient } from "@repo/shared"

const PRESENCE_CHANNEL = "global-presence"

interface PresenceContextType {
  onlineUsers: Set<string>
}

const PresenceContext = createContext<PresenceContextType>({ onlineUsers: new Set() })

export function PresenceProvider({ children, userId }: { children: React.ReactNode, userId?: string }) {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const ably = getAblyClient()

  useEffect(() => {
    if (!ably) return

    const channel = ably.channels.get(PRESENCE_CHANNEL)

    const updatePresence = async () => {
      try {
        const presenceMessages = await channel.presence.get()
        const userIds = presenceMessages.map((msg) => msg.clientId)
        setOnlineUsers(new Set(userIds))
      } catch (error) {
        console.error("Error fetching presence:", error)
      }
    }

    if (userId) {
      channel.presence.enterClient(userId, { status: "online" })
    }

    channel.presence.subscribe(["enter", "present"], (member) => {
      setOnlineUsers((prev) => new Set([...prev, member.clientId]))
    })

    channel.presence.subscribe("leave", (member) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev)
        next.delete(member.clientId)
        return next
      })
    })

    updatePresence()

    return () => {
      channel.presence.unsubscribe()
      if (userId) {
        channel.presence.leaveClient(userId)
      }
    }
  }, [ably, userId])

  return (
    <PresenceContext.Provider value={{ onlineUsers }}>
      {children}
    </PresenceContext.Provider>
  )
}

export const usePresence = () => useContext(PresenceContext)

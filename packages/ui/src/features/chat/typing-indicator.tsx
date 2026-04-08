"use client"

import { useEffect, useState, useRef } from "react"
import { getAblyClient, AblyChannels, AblyEvents } from "@repo/shared"
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar"

interface TypingIndicatorProps {
  channelId: string
  currentUserId: string
}

export function TypingIndicator({ channelId, currentUserId }: TypingIndicatorProps) {
  const [typingUsers, setTypingUsers] = useState<any[]>([])
  const ably = getAblyClient()

  useEffect(() => {
    if (!ably || !channelId) return

    const channel = ably.channels.get(AblyChannels.channel(channelId))

    const handleTypingStart = (message: any) => {
      const { userId, name, avatar } = message.data
      if (userId === currentUserId) return

      setTypingUsers((prev) => {
        if (prev.find((u) => u.userId === userId)) return prev
        return [...prev, { userId, name, avatar }]
      })
    }

    const handleTypingStop = (message: any) => {
      const { userId } = message.data
      setTypingUsers((prev) => prev.filter((u) => u.userId !== userId))
    }

    channel.subscribe(AblyEvents.TYPING_START, handleTypingStart)
    channel.subscribe(AblyEvents.TYPING_STOP, handleTypingStop)

    return () => {
      channel.unsubscribe(AblyEvents.TYPING_START, handleTypingStart)
      channel.unsubscribe(AblyEvents.TYPING_STOP, handleTypingStop)
    }
  }, [ably, channelId, currentUserId])

  if (typingUsers.length === 0) return null

  return (
    <div className="flex items-center gap-2 px-4 py-1 animate-in fade-in slide-in-from-bottom-1 duration-300">
      <div className="flex -space-x-2">
        {typingUsers.slice(0, 3).map((user) => (
          <Avatar key={user.userId} className="h-5 w-5 border-2 border-background">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="text-[8px]">{user.name[0]}</AvatarFallback>
          </Avatar>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground font-medium">
          {typingUsers.length === 1
            ? `${typingUsers[0].name} is typing`
            : typingUsers.length === 2
            ? `${typingUsers[0].name} and ${typingUsers[1].name} are typing`
            : `${typingUsers.length} people are typing`}
        </span>
        <span className="flex gap-0.5 mt-0.5">
          <span className="h-1 w-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="h-1 w-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="h-1 w-1 bg-muted-foreground rounded-full animate-bounce" />
        </span>
      </div>
    </div>
  )
}

export function useTypingNotifier(channelId: string, user: any) {
  const ably = getAblyClient()
  const typingTimeoutRef = useRef<any>(null)
  const isTypingRef = useRef(false)

  // Ensure typing stops when component unmounts or channel changes
  useEffect(() => {
    return () => {
      if (isTypingRef.current) {
        notifyTyping(false)
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [channelId])

  const notifyTyping = (isTyping: boolean) => {
    if (!ably || !channelId || !user) return

    const channel = ably.channels.get(AblyChannels.channel(channelId))
    const event = isTyping ? AblyEvents.TYPING_START : AblyEvents.TYPING_STOP

    channel.publish(event, {
      userId: user.id,
      name: user.name,
      avatar: user.avatar || user.image
    })

    isTypingRef.current = isTyping
  }

  const handleKeyPress = () => {
    if (!isTypingRef.current) {
      notifyTyping(true)
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      notifyTyping(false)
    }, 3000)
  }

  return { handleKeyPress, stopTyping: () => notifyTyping(false) }
}

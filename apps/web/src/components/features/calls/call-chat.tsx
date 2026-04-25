"use client"

import { useState, useEffect, useRef } from "react"
import { Send } from "lucide-react"
import { Button } from "@repo/ui/components/button"
import { Input } from "@repo/ui/components/input"
import { ScrollArea } from "@repo/ui/components/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar"
import { getAblyClient } from "@repo/shared"
import { useSession } from "@repo/shared"

interface Message {
  id: string
  userId: string
  userName: string
  userImage?: string
  content: string
  timestamp: number
}

interface CallChatProps {
  callId: string
}

export function CallChat({ callId }: CallChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const { data: session } = useSession()
  const scrollRef = useRef<HTMLDivElement>(null)

  const channelName = `call-chat:${callId}`

  useEffect(() => {
    const ably = getAblyClient()
    if (!ably) return

    const channel = ably.channels.get(channelName)

    const handleMessage = (message: any) => {
      setMessages((prev) => [...prev, message.data])
    }

    channel.subscribe("message", handleMessage)

    return () => {
      channel.unsubscribe("message", handleMessage)
      ably.channels.release(channelName)
    }
  }, [callId, channelName])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !session?.user) return

    const ably = getAblyClient()
    if (!ably) return

    const channel = ably.channels.get(channelName)

    const messageData: Message = {
      id: Math.random().toString(36).substring(7),
      userId: session.user.id,
      userName: session.user.name,
      userImage: session.user.image || undefined,
      content: inputValue,
      timestamp: Date.now(),
    }

    await channel.publish("message", messageData)
    setInputValue("")
  }

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-l border-zinc-800 w-80">
      <div className="p-4 border-b border-zinc-800">
        <h3 className="font-semibold text-white">In-Call Chat</h3>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={msg.userImage} />
                <AvatarFallback className="text-[10px] bg-zinc-700">
                  {msg.userName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white truncate">
                    {msg.userName}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-zinc-300 break-words">
                  {msg.content}
                </p>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-zinc-800">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSendMessage()
          }}
          className="flex gap-2"
        >
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Send a message..."
            className="bg-zinc-800 border-none text-white text-sm focus-visible:ring-1 focus-visible:ring-primary"
          />
          <Button type="submit" size="icon" className="shrink-0 h-9 w-9">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}

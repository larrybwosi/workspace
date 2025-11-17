"use client"

import * as React from "react"
import { Sparkles, Send, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { useChat } from "@ai-sdk/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface Conversation {
  id: string
  title: string
  updatedAt: Date
}

export function AssistantChannel() {
  const [selectedConversation, setSelectedConversation] = React.useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: conversations } = useQuery({
    queryKey: ["assistant-conversations"],
    queryFn: async () => {
      const { data } = await axios.get("/api/assistant/conversations")
      return data as Conversation[]
    },
  })

  const createConversation = useMutation({
    mutationFn: async () => {
      const { data } = await axios.post("/api/assistant/conversations", {
        title: "New Conversation",
      })
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["assistant-conversations"] })
      setSelectedConversation(data.id)
    },
  })

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: "/api/assistant/chat",
    body: {
      conversationId: selectedConversation,
    },
    onFinish: () => {
      queryClient.invalidateQueries({ queryKey: ["assistant-conversations"] })
    },
  })

  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div className="flex flex-col h-full">
      <div className="h-14 border-b border-border flex items-center gap-3 px-6">
        <div className="h-8 w-8 rounded-lg bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold">AI Assistant</h2>
          <p className="text-xs text-muted-foreground">Enterprise MCP-powered assistant</p>
        </div>
        <Button onClick={() => createConversation.mutate()} size="sm" variant="outline">
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1 p-6" ref={scrollRef}>
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.length === 0 && (
            <Card className="p-6 bg-muted">
              <p className="text-sm">
                Hello! I'm your AI assistant with access to:
                <br />
                <br />
                • Tasks and project management
                <br />
                • Search across all workspace content
                <br />
                • Notes and documentation
                <br />
                • Analytics and reporting
                <br />
                <br />
                How can I help you today?
              </p>
            </Card>
          )}
          
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}>
              {message.role === "assistant" && (
                <Avatar className="h-8 w-8 shrink-0">
                  <div className="h-full w-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                </Avatar>
              )}
              <Card
                className={`p-4 max-w-[80%] ${
                  message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </Card>
              {message.role === "user" && (
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="text-xs">You</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <div className="h-full w-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
              </Avatar>
              <Card className="p-4 bg-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
              </Card>
            </div>
          )}
          
          {error && (
            <Card className="p-4 bg-destructive/10 text-destructive">
              <p className="text-sm">Error: {error.message}</p>
            </Card>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-border p-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-2">
          <Textarea
            placeholder="Ask me anything..."
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e as any)
              }
            }}
            className="min-h-[60px] max-h-[200px]"
            disabled={isLoading}
          />
          <Button type="submit" disabled={!input?.trim() || isLoading} size="icon" className="h-[60px] w-[60px]">
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  )
}

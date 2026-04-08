"use client"

import { useChat } from "@ai-sdk/react"
import { Sparkles, Send, User, Bot, Loader2 } from "lucide-react"
import { Button } from "../../components/button"
import { Input } from "../../components/input"
import { ScrollArea } from "../../components/scroll-area"
import { Avatar, AvatarFallback } from "../../components/avatar"
import { useEffect, useRef } from "react"
import { cn } from "../../lib/utils"

export function AssistantChannel() {
  const chat = useChat({
    // @ts-ignore
    api: "/api/assistant/chat",
  })
  const { messages = [], input = "", handleInputChange, handleSubmit, isLoading = false } = chat as any
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current && messages.length > 0) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }, [messages])

  return (
    <div className="flex flex-col h-full bg-background">
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="max-w-3xl mx-auto space-y-6 pb-4">
          {messages && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-blue-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">How can I help you today?</h2>
                <p className="text-muted-foreground">
                  I'm your AI assistant, ready to help with your workspace and messages.
                </p>
              </div>
            </div>
          )}

          {messages.map((m: any) => (
            <div
              key={m.id}
              className={cn(
                "flex gap-4 p-4 rounded-lg",
                m.role === "user" ? "bg-muted/50" : "bg-blue-500/5 border border-blue-500/10"
              )}
            >
              <Avatar className="h-8 w-8 shrink-0">
                {m.role === "user" ? (
                  <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                ) : (
                  <AvatarFallback className="bg-blue-500 text-white"><Bot className="h-4 w-4" /></AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-semibold">
                  {m.role === "user" ? "You" : "Assistant"}
                </p>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {m.content}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4 p-4 rounded-lg bg-blue-500/5 animate-pulse">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-blue-500 text-white"><Bot className="h-4 w-4" /></AvatarFallback>
              </Avatar>
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-background/50 backdrop-blur-sm">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto relative flex items-center gap-2"
        >
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask anything..."
            className="pr-12 h-12"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input?.trim()}
            className="absolute right-1.5 top-1.5 h-9 w-9"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}

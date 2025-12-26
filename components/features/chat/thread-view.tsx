"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageItem } from "./message-item"
import { MessageComposer } from "./message-composer"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton" 
import { Loader2 } from "lucide-react"
import type { Thread, Message } from "@/lib/types"
import { mockThread, mockUsers } from "@/lib/mock-data"
import { useMessages, useSendMessage, useReplyToMessage, useMarkMessageAsRead } from "@/hooks/api/use-messages"
import { useAddReaction, useRemoveReaction } from "@/hooks/api/use-reactions"

interface ThreadViewProps {
  thread?: Thread
  channelId?: string
}

// Helper component for loading state
function MessageSkeleton() {
  return (
    <div className="flex items-start gap-3 py-2 px-3 sm:px-4">
      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-4 w-[85%]" />
        <Skeleton className="h-4 w-[65%]" />
      </div>
    </div>
  )
}

export function ThreadView({ thread = mockThread, channelId }: ThreadViewProps) {
  const searchParams = useSearchParams()
  const highlightedMessageId = searchParams.get("messageId")

  const activeChannelId = channelId || thread.channelId
  const { data: messagesData, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useMessages(activeChannelId)
  const sendMessageMutation = useSendMessage()
  const replyToMessageMutation = useReplyToMessage()
  const addReactionMutation = useAddReaction()
  const removeReactionMutation = useRemoveReaction()
  const markAsReadMutation = useMarkMessageAsRead()

  const [replyingTo, setReplyingTo] = React.useState<{ id: string; userName: string } | null>(null)
  const scrollAreaRef = React.useRef<HTMLDivElement>(null)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const highlightedMessageRef = React.useRef<HTMLDivElement>(null)

  const messages = React.useMemo(() => {
    if (!messagesData?.pages) return thread.messages
    return messagesData.pages.flatMap((page) => page.messages)
  }, [messagesData, thread.messages])

  React.useEffect(() => {
    if (highlightedMessageId && highlightedMessageRef.current) {
      setTimeout(() => {
        highlightedMessageRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        })
      }, 100)
    } else if (!isLoading) {
      // Only scroll to bottom if we aren't loading initial data
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, highlightedMessageId, isLoading])

  React.useEffect(() => {
    if (messages.length > 0) {
      const unreadMessages = messages.filter((m) => !m.readByCurrentUser)
      if (unreadMessages.length > 0) {
        unreadMessages.forEach((msg) => {
          markAsReadMutation.mutate({
            messageId: msg.id,
            channelId: activeChannelId,
          })
        })
      }
    }
  }, [messages, activeChannelId])

  const firstUnreadMessageId = React.useMemo(() => {
    const firstUnread = messages.find((m) => !m.readByCurrentUser)
    return firstUnread?.id || null
  }, [messages])

  const organizedMessages = React.useMemo(() => {
    const messageMap = new Map<string, Message & { replies: Message[] }>()
    const rootMessages: (Message & { replies: Message[] })[] = []

    messages.forEach((msg) => {
      messageMap.set(msg.id, { ...msg, replies: [] })
    })

    messages.forEach((msg) => {
      const messageWithReplies = messageMap.get(msg.id)!
      if (msg.replyTo) {
        const parent = messageMap.get(msg.replyTo)
        if (parent) {
          parent.replies.push(messageWithReplies)
        } else {
          rootMessages.push(messageWithReplies)
        }
      } else {
        rootMessages.push(messageWithReplies)
      }
    })

    return rootMessages
  }, [messages])

  const handleSendMessage = (content: string) => {
    if (replyingTo) {
      replyToMessageMutation.mutate({
        messageId: replyingTo.id,
        channelId: activeChannelId,
        userId: mockUsers[0].id,
        content,
        mentions: [],
        messageType: "standard" as const,
      })
    } else {
      sendMessageMutation.mutate({
        channelId: activeChannelId,
        userId: mockUsers[0].id,
        content,
        mentions: [],
        messageType: "standard" as const,
      })
    }

    setReplyingTo(null)
  }

  const handleReply = (messageId: string) => {
    const replyMessage = messages.find((m) => m.id === messageId)
    if (replyMessage) {
      const user = mockUsers.find((u) => u.id === replyMessage.userId)
      setReplyingTo({ id: messageId, userName: user?.name || "Unknown" })
    }
  }

  const handleReaction = (messageId: string, emoji: string) => {
    const message = messages.find((m) => m.id === messageId)
    if (!message) return

    const existingReaction = message.reactions.find((r) => r.emoji === emoji)
    const currentUserId = mockUsers[0].id

    if (existingReaction?.users.includes(currentUserId)) {
      removeReactionMutation.mutate({
        messageId,
        emoji,
        channelId: activeChannelId,
      })
    } else {
      addReactionMutation.mutate({
        messageId,
        emoji,
        channelId: activeChannelId,
      })
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 relative h-full">
      {/* Header */}
      <div className="px-3 sm:px-4 py-3 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
          <h2 className="font-semibold text-sm sm:text-base truncate">{thread.title}</h2>
          <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
            {isLoading ? "..." : messages.length} messages
          </span>
        </div>
      </div>

      {/* Messages Area - flex-1 pushes footer down */}
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        {hasNextPage && (
          <div className="flex justify-center py-4">
            <Button variant="outline" size="sm" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load more messages"
              )}
            </Button>
          </div>
        )}

        <div className="py-2 sm:py-4">
          {isLoading ? (
            // Skeleton Loading State
            <div className="space-y-4 pt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <MessageSkeleton key={i} />
              ))}
            </div>
          ) : (
            // Empty State or Message List
            <>
              {organizedMessages.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-[50vh] text-center p-4">
                    <p className="text-muted-foreground text-sm">No messages yet. Be the first to start the conversation!</p>
                 </div>
              ) : (
                organizedMessages.map((message, idx) => {
                  const showAvatar = idx === 0 || organizedMessages[idx - 1].userId !== message.userId
                  const isHighlighted = message.id === highlightedMessageId
                  const showUnreadDivider = message.id === firstUnreadMessageId

                  return (
                    <React.Fragment key={message.id}>
                      {showUnreadDivider && (
                        <div className="relative flex items-center py-2 px-4">
                          <div className="flex-1 border-t-2 border-red-500" />
                          <span className="px-3 text-xs font-semibold text-red-500 bg-background">NEW</span>
                          <div className="flex-1 border-t-2 border-red-500" />
                        </div>
                      )}
                      <MessageItem
                        message={message}
                        showAvatar={showAvatar}
                        onReply={handleReply}
                        onReaction={handleReaction}
                        depth={0}
                        isReply={false}
                        isHighlighted={isHighlighted}
                        highlightRef={isHighlighted ? highlightedMessageRef : undefined}
                      />
                      {message.replies.map((reply) => (
                        <MessageItem
                          key={reply.id}
                          message={reply}
                          showAvatar={true}
                          onReply={handleReply}
                          onReaction={handleReaction}
                          depth={1}
                          isReply={true}
                          isHighlighted={reply.id === highlightedMessageId}
                          highlightRef={reply.id === highlightedMessageId ? highlightedMessageRef : undefined}
                        />
                      ))}
                    </React.Fragment>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </ScrollArea>

      {/* Composer - Always at the bottom because of flex layout */}
      <div className="shrink-0 border-t border-border bg-background mt-auto">
        <MessageComposer
          onSend={handleSendMessage}
          placeholder={replyingTo ? `Reply to ${replyingTo.userName}...` : "Type a message..."}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
        />
      </div>
    </div>
  )
}
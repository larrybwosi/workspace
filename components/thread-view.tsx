"use client"
import * as React from "react"
import { useSearchParams } from 'next/navigation'
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageItem } from "./message-item"
import { MessageComposer } from "./message-composer"
import { Button } from "@/components/ui/button"
import { Loader2 } from 'lucide-react'
import type { Thread, Message } from "@/lib/types"
import { mockThread, mockUsers } from "@/lib/mock-data"
import { useMessages, useSendMessage, useReplyToMessage, useMarkMessageAsRead } from "@/hooks/api/use-messages"
import { useAddReaction, useRemoveReaction } from "@/hooks/api/use-reactions"

interface ThreadViewProps {
  thread?: Thread
  channelId?: string
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
  
  // Track which messages have already been marked as read
  const markedAsReadRef = React.useRef<Set<string>>(new Set())

  const messages = React.useMemo(() => {
    if (!messagesData?.pages) return thread.messages
    return messagesData.pages.flatMap((page) => page.messages)
  }, [messagesData, thread.messages])

  // Scroll to highlighted message or bottom
  React.useEffect(() => {
    if (highlightedMessageId && highlightedMessageRef.current) {
      setTimeout(() => {
        highlightedMessageRef.current?.scrollIntoView({ 
          behavior: "smooth", 
          block: "center" 
        })
      }, 100)
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages.length, highlightedMessageId]) // Only depend on length, not the entire array

  // Mark unread messages as read - OPTIMIZED
  React.useEffect(() => {
    if (messages.length === 0) return

    const unreadMessages = messages.filter(
      m => !m.readByCurrentUser && !markedAsReadRef.current.has(m.id)
    )
    
    if (unreadMessages.length > 0) {
      // Mark them in our ref immediately to prevent duplicate calls
      unreadMessages.forEach(msg => {
        markedAsReadRef.current.add(msg.id)
      })
      
      // Batch the API calls
      unreadMessages.forEach(msg => {
        markAsReadMutation.mutate({
          messageId: msg.id,
          channelId: activeChannelId,
        })
      })
    }
  }, [messages.length, activeChannelId]) // Only run when message count or channel changes

  const firstUnreadMessageId = React.useMemo(() => {
    const firstUnread = messages.find(m => !m.readByCurrentUser)
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

  // Memoize callbacks to prevent unnecessary rerenders
  const handleSendMessage = React.useCallback((content: string) => {
    const messageData = {
      channelId: activeChannelId,
      userId: mockUsers[0].id,
      content,
      mentions: [],
      messageType: "standard" as const,
      replyTo: replyingTo?.id,
      depth: replyingTo ? 1 : 0,
    }

    if (replyingTo) {
      replyToMessageMutation.mutate({
        ...messageData,
        messageId: replyingTo.id,
      })
    } else {
      sendMessageMutation.mutate(messageData)
    }

    setReplyingTo(null)
  }, [activeChannelId, replyingTo, replyToMessageMutation, sendMessageMutation])

  const handleReply = React.useCallback((messageId: string) => {
    const replyMessage = messages.find((m) => m.id === messageId)
    if (replyMessage) {
      const user = mockUsers.find((u) => u.id === replyMessage.userId)
      setReplyingTo({ id: messageId, userName: user?.name || "Unknown" })
    }
  }, [messages])

  const handleReaction = React.useCallback((messageId: string, emoji: string) => {
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
  }, [messages, activeChannelId, addReactionMutation, removeReactionMutation])

  const handleCancelReply = React.useCallback(() => {
    setReplyingTo(null)
  }, [])

  const handleLoadMore = React.useCallback(() => {
    fetchNextPage()
  }, [fetchNextPage])

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      <div className="px-3 sm:px-4 py-3 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
          <h2 className="font-semibold text-sm sm:text-base truncate">{thread.title}</h2>
          <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">{messages.length} messages</span>
        </div>
      </div>

      <ScrollArea className="flex-1 overflow-y-auto" ref={scrollAreaRef}>
        {hasNextPage && (
          <div className="flex justify-center py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadMore}
              disabled={isFetchingNextPage}
            >
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
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading messages...</div>
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
                      <span className="px-3 text-xs font-semibold text-red-500 bg-background">
                        New Messages
                      </span>
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
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t border-border bg-background">
        <MessageComposer
          onSend={handleSendMessage}
          placeholder={replyingTo ? `Reply to ${replyingTo.userName}...` : "Type a message..."}
          replyingTo={replyingTo}
          onCancelReply={handleCancelReply}
        />
      </div>
    </div>
  )
}
"use client"

import { Smile, MessageSquare, Bookmark, Copy, Pin, Trash2, Edit, LinkIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type { Message } from "@/lib/types"
import { mockUsers } from "@/lib/mock-data"
import { cn, formatTime } from "@/lib/utils"
import { renderCustomMessage } from "@/lib/message-renderer"
import { CustomEmojiPicker } from "@/components/shared/custom-emoji-picker"
import { MarkdownRenderer } from "@/components/shared/markdown-renderer"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/shared/context-menu"
import { useUpdateMessage, useDeleteMessage } from "@/hooks/api/use-messages"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { UserBadgeDisplay } from "../social/user-badge-display"

interface MessageItemProps {
  message: Message
  showAvatar?: boolean
  onReply?: (messageId: string) => void
  onReaction?: (messageId: string, emoji: string, isCustom?: boolean, customEmojiId?: string) => void
  depth?: number
  isReply?: boolean
  channelId?: string
  isHighlighted?: boolean
  highlightRef?: React.RefObject<HTMLDivElement>
}

const mockUserBadges: Record<string, any[]> = {
  "1": [
    {
      id: "1",
      name: "Admin",
      icon: "shield",
      color: "#ef4444",
      bgColor: "#fef2f2",
      tier: "legendary" as const,
      category: "role",
      isPrimary: true,
    },
    {
      id: "2",
      name: "Early Adopter",
      icon: "star",
      color: "#eab308",
      bgColor: "#fefce8",
      tier: "premium" as const,
      category: "special",
    },
  ],
  "2": [
    {
      id: "3",
      name: "Top Contributor",
      icon: "trophy",
      color: "#8b5cf6",
      bgColor: "#f5f3ff",
      tier: "elite" as const,
      category: "achievement",
      isPrimary: true,
    },
  ],
}

export function MessageItem({
  message,
  showAvatar = true,
  onReply,
  onReaction,
  depth = 0,
  isReply = false,
  channelId = undefined,
  isHighlighted = false,
  highlightRef,
}: MessageItemProps) {
  const updateMessageMutation = useUpdateMessage()
  const deleteMessageMutation = useDeleteMessage()
  const { toast } = useToast()

  const user = mockUsers.find((u) => u.id === message.userId)
  const [isHovered, setIsHovered] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const userBadges = mockUserBadges[message.userId] || []

  const handleAddReaction = (emoji: string, isCustom?: boolean, customEmojiId?: string) => {
    onReaction?.(message.id, emoji, isCustom, customEmojiId)
  }

  const handleToggleReaction = (emoji: string) => {
    onReaction?.(message.id, emoji)
  }

  const handleReply = () => {
    onReply?.(message.id)
  }

  const handleEditMessage = () => {
    setIsEditing(true)
  }

  const handleDeleteMessage = () => {
    if(!channelId) return;
    if (confirm("Are you sure you want to delete this message?")) {
      deleteMessageMutation.mutate({
        id: message.id,
        channelId,
      })
    }
  }

  const handleSaveEdit = (newContent: string) => {
    if(!channelId) return;
    updateMessageMutation.mutate({
      id: message.id,
      channelId,
      content: newContent,
    })
    setIsEditing(false)
  }

  const handleCopyMessageLink = () => {
    const messageUrl = `${window.location.origin}/channels/${channelId}?messageId=${message.id}`
    navigator.clipboard.writeText(messageUrl)
    toast({
      title: "Link copied",
      description: "Message link copied to clipboard",
    })
  }

  const customComponent = renderCustomMessage(message)

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={highlightRef}
          className={cn(
            "group relative px-4 py-2 hover:bg-muted/30 transition-colors",
            !showAvatar && "pl-16",
            isReply && "border-l-2 border-primary/30 pl-4",
            depth > 0 && "ml-12",
            isHighlighted && "bg-primary/20 animate-pulse",
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {isReply && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary/20" />}

          <div className="flex gap-3">
            {showAvatar ? (
              <Avatar className="h-9 w-9 flex-shrink-0">
                <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {user?.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-9 flex-shrink-0 flex items-start justify-center">
                {isHovered && <span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>}
              </div>
            )}

            <div className="flex-1 min-w-0">
              {showAvatar && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">{user?.name}</span>
                  {userBadges.length > 0 && <UserBadgeDisplay badges={userBadges} maxDisplay={2} size="sm" />}
                  <span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
                  {isReply && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      replied
                    </span>
                  )}
                </div>
              )}

              {isEditing ? (
                <textarea
                  value={message.content}
                  onChange={(e) => handleSaveEdit(e.target.value)}
                  className="text-sm leading-relaxed text-foreground border border-border rounded-lg bg-card p-2"
                />
              ) : (
                <div className="text-sm leading-relaxed text-foreground">
                  <MarkdownRenderer content={message.content} className="whitespace-pre-wrap" />
                </div>
              )}

              {customComponent}

              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {message.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center gap-3 p-3 border border-border rounded-lg bg-card hover:bg-muted/50 transition-colors cursor-pointer max-w-sm"
                    >
                      <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-primary">🔗</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{attachment.name}</p>
                        {attachment.size && <p className="text-xs text-muted-foreground">{attachment.size}</p>}
                      </div>
                      <Button size="sm" variant="ghost" className="text-xs">
                        Quick view
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {message.reactions && message.reactions.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {message.reactions.map((reaction, idx) => (
                    <button
                      key={idx}
                      className="flex items-center gap-1 px-2 py-1 rounded-md border border-border bg-background hover:bg-muted hover:border-primary/50 transition-colors text-xs"
                      onClick={() => handleToggleReaction(reaction.emoji)}
                    >
                      {reaction.emoji.startsWith(":") ? (
                        <img
                          src={`/placeholder.svg?height=16&width=16&query=${reaction.emoji}`}
                          alt={reaction.emoji}
                          className="h-4 w-4"
                        />
                      ) : (
                        <span className="text-base">{reaction.emoji}</span>
                      )}
                      <span className="font-medium text-muted-foreground">{reaction.count}</span>
                    </button>
                  ))}
                  <CustomEmojiPicker onEmojiSelect={handleAddReaction}>
                    <button className="flex items-center justify-center h-7 w-7 rounded-md border border-dashed border-border hover:bg-muted hover:border-primary/50 transition-colors">
                      <Smile className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </CustomEmojiPicker>
                </div>
              )}
            </div>
          </div>

          {isHovered && (
            <div className="absolute top-0 right-4 -translate-y-1/2 flex items-center gap-0.5 bg-background border border-border rounded-lg shadow-lg p-0.5">
              <CustomEmojiPicker onEmojiSelect={handleAddReaction}>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Smile className="h-4 w-4" />
                </Button>
              </CustomEmojiPicker>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleReply}>
                <MessageSquare className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Bookmark className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={handleReply}>
          <MessageSquare className="mr-2 h-4 w-4" />
          Reply to message
        </ContextMenuItem>
        <ContextMenuItem onClick={handleCopyMessageLink}>
          <LinkIcon className="mr-2 h-4 w-4" />
          Copy message link
        </ContextMenuItem>
        <ContextMenuItem onClick={() => navigator.clipboard.writeText(message.content)}>
          <Copy className="mr-2 h-4 w-4" />
          Copy message
        </ContextMenuItem>
        <ContextMenuItem>
          <Bookmark className="mr-2 h-4 w-4" />
          Save message
        </ContextMenuItem>
        <ContextMenuItem>
          <Pin className="mr-2 h-4 w-4" />
          Pin message
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={handleEditMessage}>
          <Edit className="mr-2 h-4 w-4" />
          Edit message
        </ContextMenuItem>
        <ContextMenuItem className="text-destructive focus:text-destructive" onClick={handleDeleteMessage}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete message
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

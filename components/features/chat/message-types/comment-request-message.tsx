"use client"

import * as React from "react"
import { MessageCircle, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { Message, MessageMetadata } from "@/lib/types"
import { mockUsers } from "@/lib/mock-data"

interface CommentRequestMessageProps {
  message: Message
  metadata: MessageMetadata
}

export function CommentRequestMessage({ message, metadata }: CommentRequestMessageProps) {
  const [newComment, setNewComment] = React.useState("")
  const [comments, setComments] = React.useState(metadata.comments || [])

  const handleAddComment = () => {
    if (!newComment.trim()) return

    const comment = {
      id: `comment-${Date.now()}`,
      userId: "1", // Current user
      content: newComment,
      timestamp: new Date(),
    }

    setComments([...comments, comment])
    setNewComment("")
    console.log(" Added comment:", comment)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  return (
    <div className="mt-3 border border-border rounded-lg overflow-hidden bg-card">
      <div className="p-4 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Comments & Feedback</span>
          <span className="text-xs text-muted-foreground ml-auto">{comments.length} comments</span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Existing Comments */}
        {comments.length > 0 && (
          <div className="space-y-3">
            {comments.map((comment) => {
              const user = mockUsers.find((u) => u.id === comment.userId)
              return (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {user?.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-xs font-semibold">{user?.name}</span>
                      <span className="text-xs text-muted-foreground">{formatTime(comment.timestamp)}</span>
                    </div>
                    <p className="text-sm text-foreground">{comment.content}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Add Comment Field */}
        {metadata.commentsEnabled !== false && (
          <div className="space-y-2">
            <Textarea
              placeholder="Add your feedback or comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px] text-sm resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleAddComment()
                }
              }}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Cmd/Ctrl + Enter to send</span>
              <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>
                <Send className="h-3 w-3 mr-2" />
                Add Comment
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

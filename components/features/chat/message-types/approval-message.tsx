"use client"

import * as React from "react"
import { Check, X, MessageSquare, Clock, User, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { Message, MessageMetadata } from "@/lib/types"
import { mockUsers } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface ApprovalMessageProps {
  message: Message
  metadata: MessageMetadata
}

export function ApprovalMessage({ message, metadata }: ApprovalMessageProps) {
  const [showCommentField, setShowCommentField] = React.useState(false)
  const [comment, setComment] = React.useState("")
  const [localStatus, setLocalStatus] = React.useState(metadata.approvalStatus || "pending")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const requester = mockUsers.find((u) => u.id === message.userId)
  const approver = metadata.approvedBy ? mockUsers.find((u) => u.id === metadata.approvedBy) : null

  const handleAction = async (actionId: string) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/v1/messages/${message.id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionId,
          comment: comment || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to submit action")
      }

      const data = await response.json()
      setLocalStatus(actionId === "approve" ? "approved" : "rejected")
      toast.success(`Request ${actionId === "approve" ? "approved" : "rejected"} successfully`)
      setShowCommentField(false)
    } catch (error) {
      console.error("Failed to submit action:", error)
      toast.error(error instanceof Error ? error.message : "Failed to submit action")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApprove = () => {
    handleAction("approve")
  }

  const handleReject = () => {
    handleAction("reject")
  }

  return (
    <div className="mt-3 border border-border rounded-lg overflow-hidden bg-card shadow-sm">
      <div
        className={cn(
          "p-4 border-b border-border",
          localStatus === "pending" && "bg-amber-50 dark:bg-amber-950/20",
          localStatus === "approved" && "bg-green-50 dark:bg-green-950/20",
          localStatus === "rejected" && "bg-red-50 dark:bg-red-950/20",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div
              className={cn(
                "h-10 w-10 rounded-lg flex items-center justify-center",
                localStatus === "pending" && "bg-amber-100 dark:bg-amber-900/30",
                localStatus === "approved" && "bg-green-100 dark:bg-green-900/30",
                localStatus === "rejected" && "bg-red-100 dark:bg-red-900/30",
              )}
            >
              {localStatus === "pending" && <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
              {localStatus === "approved" && <Check className="h-5 w-5 text-green-600 dark:text-green-400" />}
              {localStatus === "rejected" && <X className="h-5 w-5 text-red-600 dark:text-red-400" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-base">Approval Request</h3>
                <Badge
                  variant={
                    localStatus === "approved" ? "default" : localStatus === "rejected" ? "destructive" : "secondary"
                  }
                  className="capitalize"
                >
                  {localStatus}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {localStatus === "pending" && "This request requires your review and approval"}
                {localStatus === "approved" && "This request has been approved"}
                {localStatus === "rejected" && "This request has been rejected"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <User className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground mb-1">Requested by</p>
              <div className="flex items-center gap-2">
                {requester && (
                  <>
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">{requester.avatar}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{requester.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {requester.role}
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground mb-1">Request details</p>
              <div className="text-sm bg-muted/50 rounded-lg p-3 border border-border">
                <p className="leading-relaxed">{message.content}</p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground mb-1">Submitted</p>
              <p className="text-sm">{new Date(message.timestamp).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {localStatus === "pending" && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={() => {
                    setShowCommentField(true)
                    setTimeout(() => handleApprove(), 100)
                  }}
                  disabled={isSubmitting}
                >
                  <Check className="h-4 w-4" />
                  {isSubmitting ? "Processing..." : "Approve Request"}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1 gap-2"
                  onClick={() => {
                    setShowCommentField(true)
                    setTimeout(() => handleReject(), 100)
                  }}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4" />
                  {isSubmitting ? "Processing..." : "Reject Request"}
                </Button>
              </div>

              {showCommentField && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <MessageSquare className="h-3 w-3" />
                    Add feedback (optional)
                  </label>
                  <Textarea
                    placeholder="Provide reasoning or additional context..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[80px] text-sm resize-none"
                  />
                </div>
              )}
            </div>
          </>
        )}

        {(localStatus === "approved" || localStatus === "rejected") && approver && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {localStatus === "approved" ? "Approved by" : "Rejected by"}
                  </p>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">{approver.avatar}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{approver.name}</span>
                  </div>
                </div>
              </div>

              {(metadata.approvalComment || comment) && (
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Feedback</p>
                    <div className="text-sm bg-muted/50 rounded-lg p-3 border border-border">
                      <p className="leading-relaxed">{metadata.approvalComment || comment}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

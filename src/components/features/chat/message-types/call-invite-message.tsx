"use client"

import * as React from "react"
import { Phone, Video, Play, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useCallStore } from "@/hooks/features/use-call-store"
import { toast } from "sonner"

interface CallInviteMessageProps {
  message: any
  attachment: any
}

export function CallInviteMessage({ message, attachment }: CallInviteMessageProps) {
  const { setCall, activeCall } = useCallStore()
  const [isJoining, setIsJoining] = React.useState(false)

  const callId = message.metadata?.callId || attachment.url.split("/").pop()
  const callType = message.metadata?.callType || "video"
  const workspaceId = message.metadata?.workspaceId

  const handleJoin = async () => {
    if (activeCall) {
      toast.error("You are already in a call")
      return
    }

    setIsJoining(true)
    try {
      const response = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: callType,
          callId: callId,
          workspaceId: workspaceId
        })
      })

      if (!response.ok) throw new Error('Failed to join call')
      const data = await response.json()
      setCall(data)
    } catch (error) {
      console.error(error)
      toast.error("Failed to join call")
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <Card className="max-w-sm overflow-hidden border-2 border-primary/20 bg-primary/5 dark:bg-primary/10">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-lg">
            {callType === "video" ? (
              <Video className="h-5 w-5 text-primary" />
            ) : (
              <Phone className="h-5 w-5 text-primary" />
            )}
          </div>
          <div>
            <CardTitle className="text-sm font-bold">Call Invitation</CardTitle>
            <CardDescription className="text-xs">
              {message.sender.name} is inviting you to join
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex items-center gap-4 bg-background/50 p-3 rounded-lg border border-border">
          <Avatar className="h-10 w-10">
            <AvatarImage src={message.sender.avatar || message.sender.image} />
            <AvatarFallback>{message.sender.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-semibold">{message.sender.name}</p>
            <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider h-5">
              {callType} Call
            </Badge>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-10 font-bold"
          onClick={handleJoin}
          disabled={isJoining}
        >
          {isJoining ? (
            "Joining..."
          ) : (
            <>
              <Play className="h-4 w-4 fill-current" />
              Join Call Now
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

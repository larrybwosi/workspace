"use client"

import { useCallStore } from "../../hooks/features/use-call-store"
import { VideoCallContent } from "../chat/video-call-content"
import { useState, useEffect } from "react"
import { getAblyClient, AblyChannels } from "../../lib/integrations/ably"
import { useSession } from "../../lib/auth/auth-client"
import {
  Dialog,
  DialogContent,
} from "../../ui/dialog"
import { Button } from "../../ui/button"
import { Phone, PhoneOff, Video, X } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "../../ui/avatar"

export function CallContainer() {
  const { activeCall, isIncoming, incomingCallData, endCall, setCall, setIncoming, rejectCall } = useCallStore()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { data: session } = useSession()

  // Subscribe to incoming calls
  useEffect(() => {
    if (!session?.user?.id) return

    const ably = getAblyClient()
    if (!ably) return

    const userChannel = ably.channels.get(AblyChannels.user(session.user.id))

    userChannel.subscribe('incoming-call', (message) => {
        setIncoming(message.data)
    })

    return () => {
        userChannel.unsubscribe('incoming-call')
    }
  }, [session?.user?.id, setIncoming])

  // Auto-close fullscreen if no active call
  useEffect(() => {
    if (!activeCall) {
      setIsFullscreen(false)
    }
  }, [activeCall])

  if (!activeCall && !isIncoming) return null

  const handleEndCall = () => {
    endCall()
  }

  const handleAcceptCall = async () => {
    if (!incomingCallData) return

    try {
      const response = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: incomingCallData.type,
          callId: incomingCallData.callId,
          workspaceId: incomingCallData.workspaceId,
        })
      })

      if (!response.ok) throw new Error('Failed to join call')
      const data = await response.json()

      if (!data.token) {
        const tokenResponse = await fetch('/api/agora/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channelName: data.channelName,
            uid: data.uid,
          })
        })
        if (!tokenResponse.ok) throw new Error('Failed to fetch Agora token')
        const tokenData = await tokenResponse.json()
        data.token = tokenData.token
      }

      setCall({
        ...data,
        workspaceId: data.workspaceId || incomingCallData.workspaceId
      })
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <>
      {/* Incoming Call Dialog */}
      <Dialog open={isIncoming} onOpenChange={(open) => !open && rejectCall()}>
        <DialogContent className="sm:max-w-md bg-card border-border">
            <div className="flex flex-col items-center justify-center p-6 space-y-6">
                <div className="relative">
                    <Avatar className="h-24 w-24 ring-4 ring-primary/20 animate-pulse">
                        <AvatarImage src={incomingCallData?.initiator.image} />
                        <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                            {incomingCallData?.initiator.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2 bg-primary rounded-full p-2">
                        {incomingCallData?.type === 'video' ? <Video className="h-5 w-5 text-white" /> : <Phone className="h-5 w-5 text-white" />}
                    </div>
                </div>

                <div className="text-center">
                    <h3 className="text-xl font-bold">{incomingCallData?.initiator.name}</h3>
                    <p className="text-muted-foreground italic">Incoming {incomingCallData?.type} call...</p>
                </div>

                <div className="flex gap-4 w-full">
                    <Button
                        variant="destructive"
                        className="flex-1 h-12 rounded-full"
                        onClick={rejectCall}
                    >
                        <PhoneOff className="mr-2 h-5 w-5" /> Decline
                    </Button>
                    <Button
                        variant="default"
                        className="flex-1 h-12 rounded-full bg-green-600 hover:bg-green-700"
                        onClick={handleAcceptCall}
                    >
                        <Phone className="mr-2 h-5 w-5" /> Accept
                    </Button>
                </div>
            </div>
        </DialogContent>
      </Dialog>

      {/* Active Call Modal/Fullscreen */}
      {!isFullscreen && activeCall && (
        <Dialog open={!!activeCall} onOpenChange={(open) => !open && handleEndCall()}>
          <DialogContent className="max-w-[95vw] sm:max-w-7xl p-0 overflow-hidden bg-black border-none h-[90vh] sm:h-[85vh] rounded-xl">
            <VideoCallContent
              {...activeCall}
              onEnd={handleEndCall}
              isFullscreen={false}
              onToggleFullscreen={() => setIsFullscreen(true)}
              workspaceId={activeCall.workspaceId}
            />
          </DialogContent>
        </Dialog>
      )}

      {isFullscreen && activeCall && (
        <VideoCallContent
          {...activeCall}
          onEnd={handleEndCall}
          isFullscreen={true}
          onToggleFullscreen={() => setIsFullscreen(false)}
          workspaceId={activeCall.workspaceId}
        />
      )}
    </>
  )
}

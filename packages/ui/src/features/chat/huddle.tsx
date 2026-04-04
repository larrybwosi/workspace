"use client"

import { useState, useEffect } from "react"
import { Headphones, X, Mic, MicOff, Video, VideoOff, Users, PhoneOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { getAblyClient, AblyChannels, AblyEvents } from "@/lib/integrations/ably"
import { VideoCall } from "./video-call"

interface HuddleProps {
  channelId: string
  channelName: string
  user: any
  onClose: () => void
}

export function Huddle({ channelId, channelName, user, onClose }: HuddleProps) {
  const [isActive, setIsActive] = useState(false)
  const [participants, setParticipants] = useState<any[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(false)

  const ably = getAblyClient()

  useEffect(() => {
    if (!ably || !channelId) return

    const channel = ably.channels.get(AblyChannels.presence(channelId))

    const updateParticipants = async () => {
      const presence = await channel.presence.get()
      setParticipants(presence.map(p => p.data))
    }

    channel.presence.subscribe("enter", updateParticipants)
    channel.presence.subscribe("leave", updateParticipants)

    channel.presence.enter({
      id: user.id,
      name: user.name,
      avatar: user.avatar || user.image,
      isMuted,
      isVideoOn
    })

    updateParticipants()

    return () => {
      channel.presence.leave()
      channel.presence.unsubscribe()
    }
  }, [ably, channelId, user])

  const toggleHuddle = () => {
    setIsActive(!isActive)
  }

  if (isActive) {
    return (
      <div className="fixed bottom-4 right-4 w-96 bg-card border shadow-2xl rounded-2xl overflow-hidden z-50 animate-in slide-in-from-bottom-4 duration-300">
        <div className="p-4 bg-primary text-primary-foreground flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Headphones className="h-5 w-5" />
            <span className="font-bold">Huddle in #{channelName}</span>
          </div>
          <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10" onClick={() => setIsActive(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex flex-wrap gap-3">
            {participants.map((p) => (
              <div key={p.id} className="relative">
                <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                  <AvatarImage src={p.avatar} />
                  <AvatarFallback>{p.name[0]}</AvatarFallback>
                </Avatar>
                {p.isMuted && (
                  <div className="absolute -bottom-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 border-2 border-background">
                    <MicOff className="h-2.5 w-2.5" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-4 pt-2">
            <Button
              variant={isMuted ? "destructive" : "secondary"}
              size="icon"
              className="rounded-full h-12 w-12"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <MicOff /> : <Mic />}
            </Button>
            <Button
              variant={isVideoOn ? "default" : "secondary"}
              size="icon"
              className="rounded-full h-12 w-12"
              onClick={() => setIsVideoOn(!isVideoOn)}
            >
              {isVideoOn ? <Video /> : <VideoOff />}
            </Button>
            <Button
              variant="destructive"
              size="icon"
              className="rounded-full h-12 w-12"
              onClick={() => {
                setIsActive(false)
                onClose()
              }}
            >
              <PhoneOff />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-muted-foreground hover:text-primary gap-2"
      onClick={toggleHuddle}
    >
      <Headphones className="h-4 w-4" />
      <span>Huddle</span>
    </Button>
  )
}

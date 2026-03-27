"use client"

import { useEffect, useState, useMemo } from "react"
import dynamic from "next/dynamic"
import { Mic, MicOff, VideoIcon, VideoOff, Phone, Monitor, MonitorOff, Settings, MessageSquare, Users } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Dynamically import Agora components with SSR disabled
const AgoraProvider = dynamic(
  async () => {
    const { AgoraRTCProvider, default: AgoraRTC } = await import('agora-rtc-react')
    
    return {
      default: ({ children }: { children: React.ReactNode }) => {
        const client = useMemo(
          () => AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' }),
          []
        )
        
        return <AgoraRTCProvider client={client}>{children}</AgoraRTCProvider>
      }
    }
  },
  { ssr: false }
)

const VideoCallContent = dynamic(
  () => import('./video-call-content').then(mod => ({ default: mod.VideoCallContent })),
  { ssr: false }
)

interface VideoCallProps {
  callId: string
  channelName: string
  type: "voice" | "video"
  onEnd: () => void
}

export function VideoCall({ callId, channelName, type, onEnd }: VideoCallProps) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-white">Loading call...</div>
      </div>
    )
  }

  return (
    <AgoraProvider>
      <VideoCallContent 
        callId={callId}
        channelName={channelName}
        type={type}
        onEnd={onEnd}
      />
    </AgoraProvider>
  )
}

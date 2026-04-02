"use client"

import { useEffect, useState, useMemo } from "react"
import dynamic from "next/dynamic"
import { Mic, MicOff, VideoIcon, VideoOff, Phone, Monitor, MonitorOff, Settings, MessageSquare, Users } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const VideoCallContent = dynamic(
  () => import('./video-call-content').then(mod => ({ default: mod.VideoCallContent })),
  { ssr: false }
)

interface VideoCallProps {
  callId: string
  channelName: string
  type: "voice" | "video"
  token: string
  uid: number
  appId: string
  onEnd: () => void
}

export function VideoCall({ callId, channelName, type, token, uid, appId, onEnd }: VideoCallProps) {
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
    <VideoCallContent
      callId={callId}
      channelName={channelName}
      type={type}
      onEnd={onEnd}
      token={token}
      uid={uid}
      appId={appId}
    />
  )
}

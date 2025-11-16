"use client"

import { useEffect, useState } from "react"
import { 
  useJoin,
  useLocalMicrophoneTrack,
  useLocalCameraTrack,
  usePublish,
  useRemoteUsers,
  LocalVideoTrack,
  RemoteUser
} from "agora-rtc-react"
import { Mic, MicOff, VideoIcon, VideoOff, Phone, Monitor, MonitorOff, Settings, MessageSquare, Users, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface VideoCallContentProps {
  callId: string
  channelName: string
  type: "voice" | "video"
  onEnd: () => void
}

export function VideoCallContent({ callId, channelName, type, onEnd }: VideoCallContentProps) {
  const [token, setToken] = useState<string>("")
  const [uid, setUid] = useState<number>(0)
  const [calling, setCalling] = useState(false)
  const [micOn, setMicOn] = useState(true)
  const [cameraOn, setCameraOn] = useState(type === "video")
  const [screenSharing, setScreenSharing] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [callDuration, setCallDuration] = useState(0)

  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn)
  const { localCameraTrack } = useLocalCameraTrack(cameraOn)
  const remoteUsers = useRemoteUsers()

  useJoin({
    appid: process.env.NEXT_PUBLIC_AGORA_APP_ID!,
    channel: channelName,
    token: token || null,
    uid: uid || null,
  }, calling)

  usePublish([localMicrophoneTrack, localCameraTrack])

  // Fetch Agora token
  useEffect(() => {
    async function fetchToken() {
      try {
        const response = await fetch('/api/agora/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channelName, uid })
        })

        if (!response.ok) throw new Error('Failed to fetch token')

        const data = await response.json()
        setToken(data.token)
        setUid(data.uid)
        setCalling(true)

        // Join call in database
        await fetch(`/api/calls/${callId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'join' })
        })
      } catch (error) {
        console.error('[v0] Error fetching Agora token:', error)
        toast.error('Failed to join call')
      }
    }

    fetchToken()
  }, [channelName, callId, uid])

  // Call duration timer
  useEffect(() => {
    if (!calling) return

    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [calling])

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return hrs > 0 
      ? `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      : `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const toggleMic = async () => {
    setMicOn(!micOn)
    await fetch(`/api/calls/${callId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateState', muted: micOn })
    })
  }

  const toggleCamera = async () => {
    setCameraOn(!cameraOn)
    await fetch(`/api/calls/${callId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateState', videoOff: cameraOn })
    })
  }

  const toggleScreenShare = async () => {
    try {
      if (!screenSharing) {
        // Start screen sharing
        const screenTrack = await import('agora-rtc-sdk-ng').then(AgoraRTC => 
          AgoraRTC.default.createScreenVideoTrack({}, "disable")
        )
        // Publish screen track
        setScreenSharing(true)
        toast.success('Screen sharing started')
      } else {
        // Stop screen sharing
        setScreenSharing(false)
        toast.success('Screen sharing stopped')
      }
    } catch (error) {
      console.error('[v0] Error toggling screen share:', error)
      toast.error('Failed to share screen')
    }
  }

  const endCall = async () => {
    setCalling(false)
    
    await fetch(`/api/calls/${callId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'leave' })
    })

    onEnd()
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="h-16 bg-black/50 backdrop-blur-sm flex items-center justify-between px-6 text-white">
        <div>
          <h2 className="font-semibold">
            {type === "video" ? "Video Call" : "Voice Call"}
          </h2>
          <p className="text-sm text-gray-400">{formatDuration(callDuration)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-green-500/20 text-green-400">
            <Users className="h-3 w-3 mr-1" />
            {remoteUsers.length + 1}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="text-white"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className={cn(
          "grid gap-4 w-full h-full",
          remoteUsers.length === 0 && "grid-cols-1",
          remoteUsers.length === 1 && "grid-cols-2",
          remoteUsers.length >= 2 && remoteUsers.length <= 4 && "grid-cols-2 grid-rows-2",
          remoteUsers.length > 4 && "grid-cols-3 grid-rows-3"
        )}>
          {/* Local User */}
          <div className="relative bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
            {cameraOn && localCameraTrack ? (
              <LocalVideoTrack track={localCameraTrack} play className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    ME
                  </AvatarFallback>
                </Avatar>
                <p className="text-white font-medium">You</p>
              </div>
            )}
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
              <Badge variant="secondary" className="bg-black/50 text-white">
                You
              </Badge>
              {!micOn && (
                <Badge variant="destructive" className="bg-red-500/80">
                  <MicOff className="h-3 w-3" />
                </Badge>
              )}
            </div>
          </div>

          {/* Remote Users */}
          {remoteUsers.map((user) => (
            <div key={user.uid} className="relative bg-gray-900 rounded-lg overflow-hidden">
              <RemoteUser user={user} className="w-full h-full" />
              <div className="absolute bottom-4 left-4">
                <Badge variant="secondary" className="bg-black/50 text-white">
                  User {user.uid}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="h-24 bg-black/50 backdrop-blur-sm flex items-center justify-center gap-4 px-6">
        <Button
          variant={micOn ? "secondary" : "destructive"}
          size="lg"
          className="rounded-full h-14 w-14"
          onClick={toggleMic}
        >
          {micOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
        </Button>

        {type === "video" && (
          <Button
            variant={cameraOn ? "secondary" : "destructive"}
            size="lg"
            className="rounded-full h-14 w-14"
            onClick={toggleCamera}
          >
            {cameraOn ? <VideoIcon className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
          </Button>
        )}

        <Button
          variant={screenSharing ? "default" : "secondary"}
          size="lg"
          className="rounded-full h-14 w-14"
          onClick={toggleScreenShare}
        >
          {screenSharing ? <MonitorOff className="h-6 w-6" /> : <Monitor className="h-6 w-6" />}
        </Button>

        <Button
          variant="secondary"
          size="lg"
          className="rounded-full h-14 w-14"
          onClick={() => setShowChat(!showChat)}
        >
          <MessageSquare className="h-6 w-6" />
        </Button>

        <Button
          variant="secondary"
          size="lg"
          className="rounded-full h-14 w-14"
        >
          <Settings className="h-6 w-6" />
        </Button>

        <Button
          variant="destructive"
          size="lg"
          className="rounded-full h-14 w-14 bg-red-500 hover:bg-red-600"
          onClick={endCall}
        >
          <Phone className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}

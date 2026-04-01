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
  token: string
  uid: number
  appId: string
  onEnd: () => void
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
}

export function VideoCallContent({
  callId,
  channelName,
  type,
  token,
  uid,
  appId,
  onEnd,
  isFullscreen,
  onToggleFullscreen
}: VideoCallContentProps) {
  const [micOn, setMicOn] = useState(true)
  const [cameraOn, setCameraOn] = useState(type === "video")
  const [screenSharing, setScreenSharing] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [callDuration, setCallDuration] = useState(0)

  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn)
  const { localCameraTrack } = useLocalCameraTrack(cameraOn)
  const remoteUsers = useRemoteUsers()

  useJoin({
    appid: appId,
    channel: channelName,
    token: token,
    uid: uid,
  }, true)

  usePublish([localMicrophoneTrack, localCameraTrack])

  useEffect(() => {
    // Join call in database
    fetch(`/api/calls/${callId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'join' })
    }).catch(console.error)
  }, [callId])

  // Call duration timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

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
     toast.info("Screen sharing logic to be enhanced")
  }

  const endCall = async () => {
    await fetch(`/api/calls/${callId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'leave' })
    })
    onEnd()
  }

  return (
    <div className={cn(
        "bg-black flex flex-col overflow-hidden",
        isFullscreen ? "fixed inset-0 z-50" : "w-full h-full rounded-lg"
    )}>
      {/* Header */}
      <div className="h-14 bg-black/50 backdrop-blur-sm flex items-center justify-between px-4 text-white shrink-0">
        <div>
          <h2 className="text-sm font-semibold">
            {type === "video" ? "Video Call" : "Voice Call"}
          </h2>
          <p className="text-[10px] text-gray-400">{formatDuration(callDuration)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-green-500/20 text-green-400 h-5 text-[10px]">
            <Users className="h-3 w-3 mr-1" />
            {remoteUsers.length + 1}
          </Badge>
          {onToggleFullscreen && (
              <Button
                variant="ghost"
                size="icon"
                className="text-white h-8 w-8"
                onClick={onToggleFullscreen}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
          )}
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 flex items-center justify-center p-4 min-h-0 overflow-hidden">
        <div className={cn(
          "grid gap-4 w-full h-full max-h-full overflow-y-auto p-2",
          remoteUsers.length === 0 && "grid-cols-1",
          remoteUsers.length === 1 && "grid-cols-1 md:grid-cols-2",
          remoteUsers.length >= 2 && remoteUsers.length <= 4 && "grid-cols-2",
          remoteUsers.length > 4 && "grid-cols-2 lg:grid-cols-3"
        )}>
          {/* Local User */}
          <div className="relative bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center aspect-video">
            {cameraOn && localCameraTrack ? (
              <LocalVideoTrack track={localCameraTrack} play className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                    ME
                  </AvatarFallback>
                </Avatar>
                <p className="text-white text-xs font-medium">You</p>
              </div>
            )}
            <div className="absolute bottom-2 left-2 flex items-center gap-1">
              <Badge variant="secondary" className="bg-black/50 text-white text-[10px] h-4">
                You
              </Badge>
              {!micOn && (
                <Badge variant="destructive" className="bg-red-500/80 h-4 px-1">
                  <MicOff className="h-2.5 w-2.5" />
                </Badge>
              )}
            </div>
          </div>

          {/* Remote Users */}
          {remoteUsers.map((user) => (
            <div key={user.uid} className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
              <RemoteUser user={user} className="w-full h-full" />
              <div className="absolute bottom-2 left-2">
                <Badge variant="secondary" className="bg-black/50 text-white text-[10px] h-4">
                  User {user.uid}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="h-20 bg-black/50 backdrop-blur-sm flex items-center justify-center gap-3 px-4 shrink-0">
        <Button
          variant={micOn ? "secondary" : "destructive"}
          size="icon"
          className="rounded-full h-10 w-10"
          onClick={toggleMic}
        >
          {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </Button>

        {type === "video" && (
          <Button
            variant={cameraOn ? "secondary" : "destructive"}
            size="icon"
            className="rounded-full h-10 w-10"
            onClick={toggleCamera}
          >
            {cameraOn ? <VideoIcon className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>
        )}

        <Button
          variant={screenSharing ? "default" : "secondary"}
          size="icon"
          className="rounded-full h-10 w-10"
          onClick={toggleScreenShare}
        >
          {screenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
        </Button>

        <Button
          variant="destructive"
          size="icon"
          className="rounded-full h-12 w-12 bg-red-500 hover:bg-red-600"
          onClick={endCall}
        >
          <Phone className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}

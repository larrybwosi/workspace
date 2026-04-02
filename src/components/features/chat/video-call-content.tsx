'use client';

import { useEffect, useState } from 'react';
import {
  useJoin,
  useLocalMicrophoneTrack,
  useLocalCameraTrack,
  usePublish,
  useRemoteUsers,
  useLocalScreenTrack,
  LocalVideoTrack,
  RemoteUser,
} from 'agora-rtc-react';
import {
  Mic,
  MicOff,
  VideoIcon,
  VideoOff,
  Phone,
  Monitor,
  MonitorOff,
  Settings,
  MessageSquare,
  Users,
  Maximize2,
  Minimize2,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CallChat } from '../calls/call-chat';
import { useSession } from '@/lib/auth/auth-client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useWorkspaceMembers } from '@/hooks/api/use-workspaces';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface VideoCallContentProps {
  callId: string;
  channelName: string;
  type: 'voice' | 'video';
  token: string;
  uid: number;
  appId: string;
  onEnd: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  workspaceId?: string;
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
  onToggleFullscreen,
  workspaceId,
}: VideoCallContentProps) {
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(type === 'video');
  const [screenSharing, setScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    // Synchronize mic state with camera state for video calls initially
    if (type === 'video') {
      setCameraOn(true);
    }
  }, [type]);

  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
  const { localCameraTrack } = useLocalCameraTrack(cameraOn);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const {
    screenTrack,
    error: screenError,
    isLoading: isScreenLoading,
  } = useLocalScreenTrack(screenSharing, {
    encoderConfig: '1080p_1',
  });
  const remoteUsers = useRemoteUsers();
  const { data: membersData } = useWorkspaceMembers(workspaceId || '');
  const members = membersData?.members || [];
  const { data: session } = useSession();

  useJoin(
    {
      appid: appId,
      channel: channelName,
      token: token,
      uid: uid,
    },
    true
  );

  usePublish([localMicrophoneTrack, localCameraTrack, screenTrack]);

  useEffect(() => {
    if (!localMicrophoneTrack) return;

    const interval = setInterval(() => {
      const level = localMicrophoneTrack.getVolumeLevel();
      setIsSpeaking(level > 0.05);
    }, 200);

    return () => clearInterval(interval);
  }, [localMicrophoneTrack]);

  useEffect(() => {
    if (screenError) {
      setScreenSharing(false);
      if (screenError.message !== 'Permission denied') {
        toast.error('Failed to share screen: ' + screenError.message);
      }
    }
  }, [screenError]);

  useEffect(() => {
    if (screenTrack) {
      const handleTrackEnded = () => {
        setScreenSharing(false);
      };
      screenTrack.on('track-ended', handleTrackEnded);
      return () => {
        screenTrack.off('track-ended', handleTrackEnded);
      };
    }
  }, [screenTrack]);

  useEffect(() => {
    // Join call in database
    fetch(`/api/calls/${callId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'join' }),
    }).catch(console.error);
  }, [callId]);

  // Call duration timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return hrs > 0
      ? `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      : `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMic = async () => {
    setMicOn(!micOn);
    await fetch(`/api/calls/${callId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateState', muted: micOn }),
    });
  };

  const toggleCamera = async () => {
    setCameraOn(!cameraOn);
    await fetch(`/api/calls/${callId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateState', videoOff: cameraOn }),
    });
  };

  const toggleScreenShare = async () => {
    const newState = !screenSharing;
    setScreenSharing(newState);

    // If turning on screen share, turn off camera to save bandwidth and avoid confusion
    if (newState && cameraOn) {
      setCameraOn(false);
      await fetch(`/api/calls/${callId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateState', videoOff: true }),
      });
    }
  };

  const inviteMember = async (userId: string) => {
    try {
      const response = await fetch(`/api/calls/${callId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error('Failed to send invite');
      toast.success('Invite sent!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to send invite');
    }
  };

  const endCall = async () => {
    try {
      // 1. Stop and close all local tracks to release camera/mic
      if (localCameraTrack) {
        localCameraTrack.stop();
        localCameraTrack.close();
      }
      if (localMicrophoneTrack) {
        localMicrophoneTrack.stop();
        localMicrophoneTrack.close();
      }
      if (screenTrack) {
        screenTrack.stop();
        screenTrack.close();
      }

      // 2. Notify server about leaving
      await fetch(`/api/calls/${callId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'leave' }),
      });
    } catch (error) {
      console.error('Error ending call:', error);
    } finally {
      // 3. Callback to update state and close UI
      onEnd();
    }
  };

  return (
    <div
      className={cn(
        'bg-black flex flex-col overflow-hidden',
        isFullscreen ? 'fixed inset-0 z-50' : 'w-full h-full rounded-lg'
      )}
    >
      {/* Header */}
      <div className="h-14 bg-zinc-900/90 backdrop-blur-md flex items-center justify-between px-6 text-white shrink-0 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-lg">
            {type === 'video' ? (
              <VideoIcon className="h-4 w-4 text-primary" />
            ) : (
              <Phone className="h-4 w-4 text-primary" />
            )}
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight">{type === 'video' ? 'Video Call' : 'Voice Call'}</h2>
            <div className="flex items-center gap-2">
              <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <p className="text-[11px] font-medium text-zinc-400 tabular-nums">{formatDuration(callDuration)}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-green-500/20 text-green-400 h-5 text-[10px]">
            <Users className="h-3 w-3 mr-1" />
            {remoteUsers.length + 1}
          </Badge>
          {onToggleFullscreen && (
            <Button variant="ghost" size="icon" className="text-white h-8 w-8" onClick={onToggleFullscreen}>
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area (Video Grid + Chat) */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        <div className="flex-1 flex items-center justify-center p-4 min-h-0 overflow-hidden">
          <div
            className={cn(
              'grid gap-4 w-full h-full max-h-full overflow-y-auto p-2',
              (remoteUsers.length === 0 || (remoteUsers.length === 1 && showChat)) && 'grid-cols-1',
              remoteUsers.length === 1 && !showChat && 'grid-cols-1 md:grid-cols-2',
              remoteUsers.length >= 2 &&
                remoteUsers.length <= 4 &&
                (showChat ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-2'),
              remoteUsers.length > 4 && (showChat ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-3')
            )}
          >
            {/* Local User */}
            <div
              className={cn(
                'relative bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center aspect-video transition-all duration-200',
                isSpeaking && 'ring-2 ring-green-500'
              )}
            >
              {screenSharing && screenTrack ? (
                <LocalVideoTrack track={screenTrack} play className="w-full h-full object-contain bg-black" />
              ) : cameraOn && localCameraTrack ? (
                <LocalVideoTrack track={localCameraTrack} play className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Avatar className="h-20 w-20 shadow-xl">
                    <AvatarFallback className="text-2xl bg-zinc-800 text-white">
                      {session?.user?.name?.slice(0, 2).toUpperCase() || 'ME'}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-white text-sm font-semibold">{session?.user?.name || 'You'}</p>
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
            {remoteUsers.map(user => (
              <div key={user.uid} className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video group">
                <RemoteUser user={user} className="w-full h-full" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none" />
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-black/60 backdrop-blur-md text-white text-[11px] h-6 px-2 border-none"
                  >
                    User {user.uid}
                  </Badge>
                  {user.hasAudio === false && (
                    <Badge variant="destructive" className="bg-red-500/80 h-6 px-1.5 border-none">
                      <MicOff className="h-3 w-3" />
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call Chat Sidebar */}
        {showChat && (
          <div className="shrink-0 border-l border-white/10 w-80 h-full">
            <CallChat callId={callId} />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="h-24 bg-zinc-950/95 backdrop-blur-xl flex items-center justify-center gap-4 px-4 shrink-0 border-t border-white/5">
        <div className="flex items-center gap-3 bg-zinc-900/50 p-2 rounded-2xl border border-white/5">
          <Button
            variant={micOn ? 'secondary' : 'destructive'}
            size="icon"
            className={cn(
              'rounded-xl h-12 w-12 transition-all duration-200',
              micOn ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
            )}
            onClick={toggleMic}
          >
            {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>

          <Button
            variant={cameraOn ? 'secondary' : 'destructive'}
            size="icon"
            className={cn(
              'rounded-xl h-12 w-12 transition-all duration-200',
              cameraOn ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-500'
            )}
            onClick={toggleCamera}
          >
            {cameraOn ? <VideoIcon className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>

          <Button
            variant={screenSharing ? 'default' : 'secondary'}
            size="icon"
            className={cn(
              'rounded-xl h-12 w-12 transition-all duration-200',
              screenSharing ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-white'
            )}
            onClick={toggleScreenShare}
          >
            {screenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
          </Button>

          <Button
            variant={showChat ? 'default' : 'secondary'}
            size="icon"
            className={cn(
              'rounded-xl h-12 w-12 transition-all duration-200',
              showChat ? 'bg-primary hover:bg-primary/90 text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-white'
            )}
            onClick={() => setShowChat(!showChat)}
          >
            <MessageSquare className="h-5 w-5" />
          </Button>

          {workspaceId && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="rounded-xl h-12 w-12 bg-zinc-800 hover:bg-zinc-700 text-white transition-all duration-200"
                >
                  <UserPlus className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800 text-white">
                <div className="p-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-800 mb-1">
                  Invite to call
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {members
                    .filter((m: any) => m.userId !== session?.user?.id)
                    .map((member: any) => (
                      <DropdownMenuItem
                        key={member.userId}
                        className="flex items-center gap-2 cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800 transition-colors"
                        onClick={() => inviteMember(member.userId)}
                      >
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={member.user.avatar || member.user.image} />
                          <AvatarFallback className="text-[10px] bg-zinc-700 text-white font-bold">
                            {member.user.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate font-medium">{member.user.name}</span>
                      </DropdownMenuItem>
                    ))}
                  {members.length === 1 && (
                    <div className="p-4 text-center text-xs text-zinc-500">No other members to invite</div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="w-px h-10 bg-white/10 mx-2" />

        <Button
          variant="destructive"
          size="icon"
          className="rounded-xl h-12 w-12 bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20"
          onClick={endCall}
        >
          <Phone className="h-6 w-6 rotate-[135deg]" />
        </Button>
      </div>
    </div>
  );
}

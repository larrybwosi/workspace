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
  MessageSquare,
  Users,
  Maximize2,
  Minimize2,
  UserPlus,
  Volume2,
  PictureInPicture,
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
  const [micVolume, setMicVolume] = useState(100);
  const [cameraOn, setCameraOn] = useState(type === 'video');
  const [screenSharing, setScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Track which video is currently maximized/focused ('local-screen', 'local-camera', or remote uid)
  const [focusedVideoId, setFocusedVideoId] = useState<string | number | null>(null);

  useEffect(() => {
    // Synchronize mic state with camera state for video calls initially
    if (type === 'video') {
      setCameraOn(true);
    }
  }, [type]);

  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
  const { localCameraTrack } = useLocalCameraTrack(cameraOn);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { screenTrack, error: screenError } = useLocalScreenTrack(screenSharing, {
    encoderConfig: '1080p_1',
  });
  const remoteUsers = useRemoteUsers();

  // Apply Volume
  useEffect(() => {
    if (localMicrophoneTrack) {
      // Agora SDK volume range is generally 0-100 or 0-1000 depending on implementation.
      // 0-100 is safe.
      localMicrophoneTrack.setVolume(micVolume);
    }
  }, [micVolume, localMicrophoneTrack]);

  // Handle track cleanup on unmount
  useEffect(() => {
    return () => {
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
    };
  }, [localCameraTrack, localMicrophoneTrack, screenTrack]);

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

  usePublish([localMicrophoneTrack, localCameraTrack, screenTrack].filter(Boolean));

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
      setFocusedVideoId(null);
      if (screenError.message !== 'Permission denied') {
        toast.error('Failed to share screen: ' + screenError.message);
      }
    }
  }, [screenError]);

  useEffect(() => {
    if (screenTrack) {
      // Auto-focus screen share when it starts
      setFocusedVideoId('local-screen');

      const handleTrackEnded = () => {
        setScreenSharing(false);
        setFocusedVideoId(null);
      };
      screenTrack.on('track-ended', handleTrackEnded);
      return () => {
        screenTrack.off('track-ended', handleTrackEnded);
      };
    } else if (focusedVideoId === 'local-screen') {
      setFocusedVideoId(null);
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

      await fetch(`/api/calls/${callId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'leave' }),
      });
    } catch (error) {
      console.error('Error ending call:', error);
    } finally {
      onEnd();
    }
  };

  // Picture-in-Picture logic
  const handleTogglePiP = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    try {
      const container = e.currentTarget.closest('.video-container');
      const video = container?.querySelector('video');

      if (!video) return toast.error('Video element not found');

      if (document.pictureInPictureElement === video) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch (error) {
      console.error('PiP failed', error);
      toast.error('Picture-in-Picture is not supported or failed.');
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

      {/* Main Content Area (Video Grid/Focus + Chat) */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        <div className="flex-1 p-2 md:p-4 min-h-0 overflow-hidden flex">
          {focusedVideoId ? (
            // --- FOCUSED/SCREEN-SHARE LAYOUT ---
            <div className="flex flex-col md:flex-row w-full h-full gap-2 md:gap-4">
              {/* Main Focused Window */}
              <div className="flex-1 relative bg-gray-900 rounded-lg overflow-hidden video-container group shadow-2xl">
                {focusedVideoId === 'local-screen' && screenTrack && (
                  <LocalVideoTrack track={screenTrack} play className="w-full h-full object-contain" />
                )}
                {focusedVideoId === 'local-camera' && cameraOn && localCameraTrack && (
                  <LocalVideoTrack track={localCameraTrack} play className="w-full h-full object-contain" />
                )}
                {typeof focusedVideoId === 'number' && remoteUsers.find(u => u.uid === focusedVideoId) && (
                  <RemoteUser
                    user={remoteUsers.find(u => u.uid === focusedVideoId)!}
                    className="w-full h-full object-contain"
                  />
                )}

                {/* Overlays for focused view */}
                <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 bg-black/60 hover:bg-black/80 text-white border-none"
                    onClick={handleTogglePiP}
                    title="Picture in Picture"
                  >
                    <PictureInPicture className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 bg-black/60 hover:bg-black/80 text-white border-none"
                    onClick={() => setFocusedVideoId(null)}
                    title="Back to Grid"
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Side/Bottom Strip of Participants */}
              <div className="flex md:flex-col gap-2 overflow-auto md:w-56 shrink-0 md:h-full h-24 scrollbar-hide p-1">
                {/* Local Camera (if not focused) */}
                {(!focusedVideoId || focusedVideoId !== 'local-camera') && (
                  <div
                    className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video shrink-0 video-container group cursor-pointer border border-white/5"
                    onClick={() => cameraOn && setFocusedVideoId('local-camera')}
                  >
                    {cameraOn && localCameraTrack ? (
                      <LocalVideoTrack track={localCameraTrack} play className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex w-full h-full items-center justify-center bg-zinc-900">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-zinc-800 text-white">ME</AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Maximize2 className="h-5 w-5 text-white" />
                    </div>
                  </div>
                )}

                {/* Remote Users */}
                {remoteUsers
                  .filter(u => u.uid !== focusedVideoId)
                  .map(user => (
                    <div
                      key={user.uid}
                      className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video shrink-0 video-container group cursor-pointer border border-white/5"
                      onClick={() => setFocusedVideoId(user.uid)}
                    >
                      <RemoteUser user={user} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 className="h-5 w-5 text-white" />
                      </div>
                      <Badge
                        variant="secondary"
                        className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1 border-none"
                      >
                        User {user.uid}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            // --- STANDARD GRID LAYOUT ---
            <div
              className={cn(
                'grid gap-2 md:gap-4 w-full h-full max-h-full overflow-y-auto',
                (remoteUsers.length === 0 || (remoteUsers.length === 1 && showChat)) && 'grid-cols-1',
                remoteUsers.length === 1 && !showChat && 'grid-cols-1 md:grid-cols-2',
                remoteUsers.length >= 2 &&
                  remoteUsers.length <= 4 &&
                  (showChat ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-2'),
                remoteUsers.length > 4 && (showChat ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-3')
              )}
            >
              {/* Local User Box */}
              <div
                className={cn(
                  'relative bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center aspect-video transition-all duration-200 video-container group',
                  isSpeaking && 'ring-2 ring-green-500'
                )}
              >
                {cameraOn && localCameraTrack ? (
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

                {/* Local Badges & Overlays */}
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

                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {cameraOn && (
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 bg-black/60 hover:bg-black/80 text-white border-none"
                      onClick={handleTogglePiP}
                    >
                      <PictureInPicture className="h-4 w-4" />
                    </Button>
                  )}
                  {cameraOn && (
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 bg-black/60 hover:bg-black/80 text-white border-none"
                      onClick={() => setFocusedVideoId('local-camera')}
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Remote Users */}
              {remoteUsers.map(user => (
                <div
                  key={user.uid}
                  className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video group video-container"
                >
                  <RemoteUser user={user} className="w-full h-full" />

                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 bg-black/60 hover:bg-black/80 text-white border-none"
                      onClick={handleTogglePiP}
                    >
                      <PictureInPicture className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 bg-black/60 hover:bg-black/80 text-white border-none"
                      onClick={() => setFocusedVideoId(user.uid)}
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </div>

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
          )}
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
          {/* Mic Button with Hover Volume Control */}
          <div className="relative group/mic flex flex-col items-center">
            <div className="absolute -top-12 bg-zinc-800/95 border border-white/10 p-2.5 rounded-xl opacity-0 group-hover/mic:opacity-100 transition-opacity pointer-events-none group-hover/mic:pointer-events-auto flex items-center gap-2 shadow-xl">
              <Volume2 className="h-4 w-4 text-zinc-400" />
              <input
                type="range"
                min="0"
                max="100"
                value={micVolume}
                onChange={e => setMicVolume(Number(e.target.value))}
                className="w-20 h-1.5 accent-primary bg-zinc-600 rounded-full appearance-none cursor-pointer"
                title="Microphone Volume"
              />
            </div>
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
          </div>

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
                <div className="max-h-75 overflow-y-auto">
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
          <Phone className="h-6 w-6 rotate-135" />
        </Button>
      </div>
    </div>
  );
}

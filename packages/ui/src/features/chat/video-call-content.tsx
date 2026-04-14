'use client';

import { useEffect, useState, useCallback } from 'react';
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
  Shield,
  UserX,
  ShieldAlert,
  MoreVertical,
} from 'lucide-react';
import { Button } from '../../components/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/avatar';
import { Badge } from '../../components/badge';
// @ts-ignore
import { CallChat } from '../calls/call-chat';
import { useSession } from '@repo/shared';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { useWorkspaceMembers } from '@repo/api-client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../../components/dropdown-menu';
import { getAblyClient, AblyChannels } from '@repo/shared';

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
  const [masterVolume, setMasterVolume] = useState(100);
  const [cameraOn, setCameraOn] = useState(type === 'video');
  const [screenSharing, setScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [participants, setParticipants] = useState<any[]>([]);
  const { data: session } = useSession();

  // Track which video is currently maximized/focused ('local-screen', 'local-camera', or remote uid)
  const [focusedVideoId, setFocusedVideoId] = useState<string | number | null>(null);

  useEffect(() => {
    if (type === 'video') {
      setCameraOn(true);
    }
  }, [type]);

  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn) as any;
  const { localCameraTrack } = useLocalCameraTrack(cameraOn) as any;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { screenTrack, error: screenError } = useLocalScreenTrack(screenSharing, {
    encoderConfig: '1080p_1'}, "disable") as any;
  const remoteUsers = useRemoteUsers();

  const currentParticipant = participants.find(p => (p as any).userId === (session?.user?.id as any));
  const isHost = currentParticipant?.role === 'host';

  // Apply Local Mic Volume
  useEffect(() => {
    if (localMicrophoneTrack) {
      localMicrophoneTrack.setVolume(micVolume);
    }
  }, [micVolume, localMicrophoneTrack]);

  // Apply Master Volume to Remote Tracks
  useEffect(() => {
    remoteUsers.forEach(user => {
      if (user.audioTrack) {
        user.audioTrack.setVolume(masterVolume);
      }
    });
  }, [masterVolume, remoteUsers]);

  // Handle track cleanup on unmount
  useEffect(() => {
    return () => {
      [localCameraTrack, localMicrophoneTrack, screenTrack].forEach(track => {
        if (track) {
          track.stop();
          track.close();
        }
      });
    };
  }, [localCameraTrack, localMicrophoneTrack, screenTrack]);

  const { data: membersData } = useWorkspaceMembers(workspaceId || '');
  const workspaceMembers = membersData?.members || [];

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

  const broadcastScreenShare = useCallback(async () => {
    await fetch(`/api/calls/${callId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'screenShareStarted' }),
    });
  }, [callId]);

  useEffect(() => {
    if (screenTrack) {
      setFocusedVideoId('local-screen');
      broadcastScreenShare();

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
  }, [screenTrack, broadcastScreenShare]);

  const fetchParticipants = useCallback(async () => {
    try {
      const res = await fetch(`/api/calls/${callId}/participants`);
      if (res.ok) {
        const data = await res.json();
        setParticipants(data);
      }
    } catch (err) {
      console.error('Failed to fetch participants', err);
    }
  }, [callId]);

  const leaveCallLogic = useCallback(
    async (action: 'leave' | 'endForAll' = 'leave') => {
      try {
        [localCameraTrack, localMicrophoneTrack, screenTrack].forEach(track => {
          if (track) {
            track.stop();
            track.close();
          }
        });

        await fetch(`/api/calls/${callId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        });
      } catch (error) {
        console.error('Error leaving call:', error);
      } finally {
        onEnd();
      }
    },
    [callId, localCameraTrack, localMicrophoneTrack, screenTrack, onEnd]
  );

  // Ably Realtime Listeners
  useEffect(() => {
    if (!session?.user?.id) return;

    const ably = getAblyClient();
    if (!ably) return;

    const userChannel = ably.channels.get(AblyChannels.user(session.user.id));

    const handleCallEnded = () => {
      toast.info('The call has been ended by a moderator');
      onEnd();
    };

    const handleParticipantRemoved = (message: any) => {
      if (message.data.userId === session.user.id) {
        toast.error('You have been removed from the call');
        onEnd();
      } else {
        fetchParticipants();
      }
    };

    const handleScreenShareStarted = (message: any) => {
      if (message.data.agoraUid) {
        setFocusedVideoId(message.data.agoraUid);
        toast.info('Someone started sharing their screen');
      }
    };

    userChannel.subscribe('call-ended', handleCallEnded);
    userChannel.subscribe('participant-removed', handleParticipantRemoved);
    userChannel.subscribe('screen-share-started', handleScreenShareStarted);
    userChannel.subscribe('call-joined', fetchParticipants);
    userChannel.subscribe('participant-promoted', fetchParticipants);

    return () => {
      userChannel.unsubscribe('call-ended', handleCallEnded);
      userChannel.unsubscribe('participant-removed', handleParticipantRemoved);
      userChannel.unsubscribe('screen-share-started', handleScreenShareStarted);
      userChannel.unsubscribe('call-joined', fetchParticipants);
      userChannel.unsubscribe('participant-promoted', fetchParticipants);
    };
  }, [session?.user?.id, onEnd, fetchParticipants]);

  useEffect(() => {
    fetch(`/api/calls/${callId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'join', uid }),
    }).then(() => fetchParticipants());
  }, [callId, fetchParticipants, uid]);

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

  const promoteParticipant = async (targetUid: number) => {
    try {
      const res = await fetch(`/api/calls/${callId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'promote', uid: targetUid }),
      });
      if (res.ok) toast.success('Participant promoted to moderator');
    } catch (err) {
      toast.error('Failed to promote participant');
    }
  };

  const removeParticipant = async (targetUid: number) => {
    try {
      const res = await fetch(`/api/calls/${callId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', uid: targetUid }),
      });
      if (res.ok) toast.success('Participant removed from call');
    } catch (err) {
      toast.error('Failed to remove participant');
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
      toast.error('Picture-in-Picture failed');
    }
  };

  return (
    <div
      className={cn(
        'bg-black flex flex-col overflow-hidden transition-all duration-300',
        isFullscreen ? 'fixed inset-0 z-[100]' : 'w-full h-full md:rounded-xl shadow-2xl border border-white/5'
      )}
    >
      {/* Header */}
      <div className="h-14 bg-zinc-900/95 backdrop-blur-md flex items-center justify-between px-4 md:px-6 text-white shrink-0 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-lg hidden sm:block">
            {type === 'video' ? (
              <VideoIcon className="h-4 w-4 text-primary" />
            ) : (
              <Phone className="h-4 w-4 text-primary" />
            )}
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight truncate max-w-[150px] md:max-w-none">
              {type === 'video' ? 'Video Call' : 'Voice Call'}
              {isHost && <Badge className="ml-2 bg-primary/20 text-primary border-none text-[10px] py-0">Host</Badge>}
            </h2>
            <div className="flex items-center gap-2">
              <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <p className="text-[11px] font-medium text-zinc-400 tabular-nums">{formatDuration(callDuration)}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 h-6 text-[10px] px-2">
            <Users className="h-3 w-3 mr-1" />
            {remoteUsers.length + 1}
          </Badge>
          {onToggleFullscreen && (
            <Button
              variant="ghost"
              size="icon"
              className="text-zinc-400 hover:text-white h-8 w-8"
              onClick={onToggleFullscreen}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        <div className="flex-1 p-2 md:p-4 min-h-0 overflow-hidden flex">
          {focusedVideoId ? (
            <div className="flex flex-col md:flex-row w-full h-full gap-2 md:gap-4">
              <div className="flex-1 relative bg-zinc-900 rounded-xl overflow-hidden video-container group shadow-2xl border border-white/5">
                {focusedVideoId === 'local-screen' && screenTrack && (
                  <LocalVideoTrack track={screenTrack} play className="w-full h-full object-contain" />
                )}
                {focusedVideoId === 'local-camera' && cameraOn && localCameraTrack && (
                  <LocalVideoTrack track={localCameraTrack} play className="w-full h-full object-contain" />
                )}
                {typeof focusedVideoId === 'number' && (
                  <RemoteUser
                    user={remoteUsers.find(u => u.uid === focusedVideoId)!}
                    className="w-full h-full object-contain"
                    playAudio={true}
                    playVideo={true}
                  />
                )}

                <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                    onClick={() => setFocusedVideoId(null)}
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex md:flex-col gap-2 overflow-auto md:w-56 shrink-0 md:h-full h-24 scrollbar-hide">
                {(!focusedVideoId || focusedVideoId !== 'local-camera') && (
                  <div
                    className="relative bg-zinc-900 rounded-lg overflow-hidden aspect-video shrink-0 video-container group cursor-pointer border border-white/5"
                    onClick={() => cameraOn && setFocusedVideoId('local-camera')}
                  >
                    {cameraOn && localCameraTrack ? (
                      <LocalVideoTrack track={localCameraTrack} play className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex w-full h-full items-center justify-center bg-zinc-800">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-zinc-700">ME</AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                  </div>
                )}
                {remoteUsers
                  .filter(u => u.uid !== focusedVideoId)
                  .map(user => (
                    <div
                      key={user.uid}
                      className="relative bg-zinc-900 rounded-lg overflow-hidden aspect-video shrink-0 video-container group cursor-pointer border border-white/5"
                      onClick={() => setFocusedVideoId(user.uid)}
                    >
                      <RemoteUser user={user} className="w-full h-full object-cover" playAudio={true} />
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
            <div
              className={cn(
                'grid gap-2 md:gap-4 w-full h-full max-h-full overflow-y-auto content-center',
                remoteUsers.length === 0 || (remoteUsers.length === 1 && showChat)
                  ? 'grid-cols-1'
                  : remoteUsers.length === 1 && !showChat
                    ? 'grid-cols-1 md:grid-cols-2'
                    : remoteUsers.length >= 2 && remoteUsers.length <= 4
                      ? showChat
                        ? 'grid-cols-1 lg:grid-cols-2'
                        : 'grid-cols-2'
                      : 'grid-cols-2 lg:grid-cols-3'
              )}
            >
              <div
                className={cn(
                  'relative bg-zinc-900 rounded-xl overflow-hidden flex items-center justify-center aspect-video transition-all duration-200 video-container group border border-white/5',
                  isSpeaking && 'ring-2 ring-primary'
                )}
              >
                {cameraOn && localCameraTrack ? (
                  <LocalVideoTrack track={localCameraTrack} play className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Avatar className="h-16 w-16 md:h-24 md:w-24 shadow-2xl ring-4 ring-white/5">
                      <AvatarImage src={session?.user?.image || ''} />
                      <AvatarFallback className="text-2xl bg-zinc-800 text-white">
                        {session?.user?.name?.slice(0, 2).toUpperCase() || 'ME'}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-white text-sm font-semibold">{session?.user?.name || 'You'}</p>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                  <Badge
                    variant="secondary"
                    className="bg-black/40 backdrop-blur-md text-white text-[10px] h-5 px-2 border-none"
                  >
                    You
                  </Badge>
                  {!micOn && (
                    <Badge variant="destructive" className="bg-red-500/80 h-5 px-1.5 border-none">
                      <MicOff className="h-3 w-3" />
                    </Badge>
                  )}
                </div>
              </div>

              {remoteUsers.map(user => (
                <div
                  key={user.uid}
                  className="relative bg-zinc-900 rounded-xl overflow-hidden aspect-video group video-container border border-white/5"
                >
                  <RemoteUser user={user} className="w-full h-full" playAudio={true} playVideo={true} />

                  {/* Participant Moderation Controls */}
                  {isHost && (
                    <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 bg-black/60 hover:bg-black/80 text-white border-none"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-zinc-900 border-zinc-800 text-white">
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer"
                            onClick={() => promoteParticipant(Number(user.uid))}
                          >
                            <Shield className="h-4 w-4 text-primary" /> Promote to Moderator
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer text-red-400 focus:text-red-400"
                            onClick={() => removeParticipant(Number(user.uid))}
                          >
                            <UserX className="h-4 w-4" /> Remove & Ban
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}

                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
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
                </div>
              ))}
            </div>
          )}
        </div>
        {showChat && (
          <div className="shrink-0 border-l border-white/10 w-80 h-full hidden lg:block">
            <CallChat callId={callId} />
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="h-24 bg-zinc-950/95 backdrop-blur-xl flex items-center justify-center gap-3 md:gap-6 px-4 shrink-0 border-t border-white/5">
        <div className="flex items-center gap-2 md:gap-3 bg-zinc-900/60 p-2 rounded-2xl border border-white/5">
          {/* Audio Controls Group */}
          <div className="flex items-center gap-1 border-r border-white/10 pr-2 md:pr-3">
            {/* Mic Button */}
            <div className="relative group/mic flex flex-col items-center">
              <div className="absolute -top-14 bg-zinc-800/95 border border-white/10 p-3 rounded-xl opacity-0 group-hover/mic:opacity-100 transition-all pointer-events-none group-hover/mic:pointer-events-auto flex items-center gap-3 shadow-2xl z-50">
                <Mic className="h-4 w-4 text-primary" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={micVolume}
                  onChange={e => setMicVolume(Number(e.target.value))}
                  className="w-24 h-1.5 accent-primary bg-zinc-600 rounded-full appearance-none cursor-pointer"
                />
                <span className="text-[10px] text-zinc-400 w-6 font-mono">{micVolume}%</span>
              </div>
              <Button
                variant={micOn ? 'secondary' : 'destructive'}
                size="icon"
                className={cn(
                  'rounded-xl h-11 w-11 md:h-12 md:w-12 transition-all',
                  micOn ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
                )}
                onClick={toggleMic}
              >
                {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </Button>
            </div>

            {/* Master Volume Button */}
            <div className="relative group/vol flex flex-col items-center">
              <div className="absolute -top-14 bg-zinc-800/95 border border-white/10 p-3 rounded-xl opacity-0 group-hover/vol:opacity-100 transition-all pointer-events-none group-hover/vol:pointer-events-auto flex items-center gap-3 shadow-2xl z-50">
                <Volume2 className="h-4 w-4 text-green-500" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={masterVolume}
                  onChange={e => setMasterVolume(Number(e.target.value))}
                  className="w-24 h-1.5 accent-green-500 bg-zinc-600 rounded-full appearance-none cursor-pointer"
                />
                <span className="text-[10px] text-zinc-400 w-6 font-mono">{masterVolume}%</span>
              </div>
              <Button
                variant="secondary"
                size="icon"
                className="rounded-xl h-11 w-11 md:h-12 md:w-12 bg-zinc-800 hover:bg-zinc-700 text-white transition-all"
              >
                <Volume2 className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <Button
            variant={cameraOn ? 'secondary' : 'destructive'}
            size="icon"
            className={cn(
              'rounded-xl h-11 w-11 md:h-12 md:w-12 transition-all',
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
              'rounded-xl h-11 w-11 md:h-12 md:w-12 transition-all',
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
              'rounded-xl h-11 w-11 md:h-12 md:w-12 transition-all',
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
                  className="rounded-xl h-11 w-11 md:h-12 md:w-12 bg-zinc-800 hover:bg-zinc-700 text-white transition-all"
                >
                  <UserPlus className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800 text-white">
                <div className="p-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-800 mb-1">
                  Invite to call
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {workspaceMembers
                    .filter((m: any) => m.userId !== session?.user?.id)
                    .map((member: any) => (
                      <DropdownMenuItem
                        key={member.userId}
                        className="flex items-center gap-2 cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800"
                        onClick={() => inviteMember(member.userId)}
                      >
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={member.user.avatar || member.user.image} />
                          <AvatarFallback className="text-[10px] bg-zinc-700 font-bold">
                            {member.user.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate font-medium">{member.user.name}</span>
                      </DropdownMenuItem>
                    ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="w-px h-8 bg-white/10 mx-1 md:mx-2" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="destructive"
              size="icon"
              className="rounded-xl h-11 w-11 md:h-12 md:w-12 bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20"
            >
              <Phone className="h-6 w-6 rotate-135" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="bg-zinc-900 border-zinc-800 text-white">
            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => leaveCallLogic('leave')}>
              <Phone className="h-4 w-4 rotate-135 text-red-400" /> Leave Call
            </DropdownMenuItem>
            {isHost && (
              <>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem
                  className="gap-2 cursor-pointer text-red-400 focus:text-red-400 font-bold"
                  onClick={() => leaveCallLogic('endForAll')}
                >
                  <ShieldAlert className="h-4 w-4" /> End Call for Everyone
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

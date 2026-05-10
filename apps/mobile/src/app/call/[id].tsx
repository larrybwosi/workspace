import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  RtcSurfaceView,
  IRtcEngine
} from 'react-native-agora';
import { useCallStore } from '@repo/shared';
import { useSession } from '../../lib/auth';
import { CallControls } from '../../components/calls/CallControls';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';

export default function CallScreen() {
  const { id: callIdParam, type, workspaceId, workspaceSlug, recipientId, channelId } = useLocalSearchParams<{
    id: string;
    type: 'voice' | 'video';
    workspaceId?: string;
    workspaceSlug?: string;
    recipientId?: string;
    channelId?: string;
  }>();

  const { data: session } = (useSession as any)();
  const { setCall, endCall, activeCall, updateActiveCall, setMinimized } = useCallStore();
  const router = useRouter();
  const engine = useRef<IRtcEngine | null>(null);

  const [joined, setJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState<number[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(type === 'voice');
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [currentCallId, setCurrentCallId] = useState<string | null>(callIdParam === 'new' ? null : callIdParam);

  useEffect(() => {
    init();
    return () => {
      engine.current?.leaveChannel();
      engine.current?.release();
    };
  }, []);

  const init = async () => {
    try {
      // 1. Join or Start call via API to get token
      const baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
      const body: any = {
        type: type || 'voice',
        workspaceId,
        workspaceSlug
      };

      if (callIdParam !== 'new') {
        body.callId = callIdParam;
      } else {
        if (recipientId) body.recipientId = recipientId;
        if (channelId) body.channelId = channelId;
      }

      const response = await axios.post(`${baseURL}/api/calls`, body);

      const { token, appId, channelName, uid, callId } = response.data;
      setCurrentCallId(callId);

      setCall({
        callId,
        channelName,
        type: type || 'voice',
        token,
        uid,
        appId,
      });

      // 2. Initialize Agora Engine
      engine.current = createAgoraRtcEngine();
      engine.current.initialize({ appId });

      // 3. Setup Listeners
      engine.current.registerEventHandler({
        onJoinChannelSuccess: async () => {
          setJoined(true);
          // Mark as joined in backend
          await axios.patch(`${baseURL}/api/calls/${callId}`, {
            action: 'join',
            uid
          });
        },
        onUserJoined: (connection, uid) => {
          setRemoteUid(prev => [...prev, uid]);
        },
        onUserOffline: (connection, uid) => {
          setRemoteUid(prev => prev.filter(id => id !== uid));
        },
        onError: (err) => {
          console.error('Agora Error:', err);
        }
      });

      // 4. Configure based on type
      if (type === 'video') {
        engine.current.enableVideo();
      } else {
        engine.current.enableAudio();
      }

      // 5. Join Channel
      engine.current.joinChannel(token, channelName, uid, {
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
      });

    } catch (e) {
      console.error('Failed to initialize call:', e);
      Alert.alert('Error', 'Failed to join call');
      router.back();
    }
  };

  const handleEndCall = async () => {
    engine.current?.leaveChannel();
    endCall();
    router.back();

    // Notify backend
    const baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
    if (currentCallId) {
      try {
        await axios.patch(`${baseURL}/api/calls/${currentCallId}`, { action: 'leave' });
      } catch (e) {}
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    engine.current?.muteLocalAudioStream(newMuted);
    updateActiveCall({ isMuted: newMuted });
  };

  const toggleVideo = () => {
    const newVideoOff = !isVideoOff;
    setIsVideoOff(newVideoOff);
    engine.current?.muteLocalVideoStream(newVideoOff);
    updateActiveCall({ isVideoOff: newVideoOff });
  };

  const toggleSpeaker = () => {
    const newSpeaker = !isSpeaker;
    setIsSpeaker(newSpeaker);
    engine.current?.setEnableSpeakerphone(newSpeaker);
    updateActiveCall({ isSpeakerphone: newSpeaker });
  };

  const handleMinimize = () => {
    setMinimized(true);
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-discord-base">
      <View className="flex-1 px-4 py-6">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-8">
          <TouchableOpacity onPress={handleMinimize}>
            <MaterialIcons name="keyboard-arrow-down" size={32} color="white" />
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-white font-bold text-xl">{type === 'video' ? 'Video Call' : 'Voice Call'}</Text>
            <Text className="text-discord-muted">{joined ? 'Connected' : 'Connecting...'}</Text>
          </View>
          <View style={{ width: 32 }} />
        </View>

        {/* Call View */}
        <View className="flex-1 bg-discord-sidebar rounded-3xl overflow-hidden items-center justify-center">
          {type === 'video' ? (
            <View className="w-full h-full">
              {remoteUid.length > 0 ? (
                <RtcSurfaceView
                  canvas={{ uid: remoteUid[0] }}
                  style={{ flex: 1 }}
                />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <View className="w-24 h-24 rounded-full bg-discord-blurple items-center justify-center">
                    <MaterialIcons name="person" size={48} color="white" />
                  </View>
                  <Text className="text-white mt-4 font-medium">Waiting for others...</Text>
                </View>
              )}
              {/* Local Preview */}
              {!isVideoOff && (
                <View className="absolute bottom-4 right-4 w-32 h-48 bg-black rounded-xl overflow-hidden border-2 border-discord-blurple">
                  <RtcSurfaceView
                    canvas={{ uid: 0 }}
                    style={{ flex: 1 }}
                  />
                </View>
              )}
            </View>
          ) : (
            <View className="items-center">
               <View className="w-32 h-32 rounded-full bg-discord-blurple items-center justify-center mb-6">
                <MaterialIcons name="person" size={64} color="white" />
              </View>
              <Text className="text-white text-2xl font-bold">In Call</Text>
              <Text className="text-discord-muted mt-2">Voice Call</Text>
            </View>
          )}
        </View>

        {/* Controls */}
        <CallControls
          type={type || 'voice'}
          onEndCall={handleEndCall}
          onToggleMute={toggleMute}
          onToggleVideo={toggleVideo}
          onToggleSpeaker={toggleSpeaker}
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          isSpeaker={isSpeaker}
        />
      </View>
    </SafeAreaView>
  );
}

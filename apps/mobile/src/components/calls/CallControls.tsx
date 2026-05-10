import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useCallStore } from '@repo/shared';

interface Props {
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleVideo?: () => void;
  onToggleSpeaker: () => void;
  isMuted: boolean;
  isVideoOff?: boolean;
  isSpeaker: boolean;
  type: 'voice' | 'video';
}

export function CallControls({
  onEndCall,
  onToggleMute,
  onToggleVideo,
  onToggleSpeaker,
  isMuted,
  isVideoOff,
  isSpeaker,
  type
}: Props) {
  return (
    <View className="flex-row justify-around items-center w-full px-6 py-8">
      <TouchableOpacity
        onPress={onToggleSpeaker}
        className={`w-14 h-14 rounded-full items-center justify-center ${isSpeaker ? 'bg-white' : 'bg-discord-sidebar'}`}
      >
        <MaterialIcons name={isSpeaker ? "volume-up" : "volume-down"} size={28} color={isSpeaker ? "black" : "white"} />
      </TouchableOpacity>

      {type === 'video' && (
        <TouchableOpacity
          onPress={onToggleVideo}
          className={`w-14 h-14 rounded-full items-center justify-center ${isVideoOff ? 'bg-red-500' : 'bg-discord-sidebar'}`}
        >
          <MaterialIcons name={isVideoOff ? "videocam-off" : "videocam"} size={28} color="white" />
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={onToggleMute}
        className={`w-14 h-14 rounded-full items-center justify-center ${isMuted ? 'bg-white' : 'bg-discord-sidebar'}`}
      >
        <MaterialIcons name={isMuted ? "mic-off" : "mic"} size={28} color={isMuted ? "black" : "white"} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onEndCall}
        className="w-16 h-16 bg-red-500 rounded-full items-center justify-center"
      >
        <MaterialIcons name="call-end" size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
}

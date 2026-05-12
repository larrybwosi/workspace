import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useCallStore } from '@repo/shared';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export function MinimizedCallOverlay() {
  const { activeCall, isMinimized, setMinimized } = useCallStore();
  const router = useRouter();

  if (!activeCall || !isMinimized) return null;

  const handleReturn = () => {
    setMinimized(false);
    router.push({
      pathname: '/call/[id]',
      params: { id: activeCall.callId },
    } as any);
  };

  return (
    <TouchableOpacity
      onPress={handleReturn}
      className="absolute top-12 left-4 right-4 bg-discord-blurple rounded-xl p-3 flex-row items-center shadow-lg z-40"
    >
      <View className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-3" />
      <Text className="text-white font-bold flex-1">Active {activeCall.type} call...</Text>
      <MaterialIcons name="fullscreen" size={24} color="white" />
    </TouchableOpacity>
  );
}

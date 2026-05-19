import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useCallStore } from '@repo/shared';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export function IncomingCallOverlay() {
  const { isIncoming, incomingCallData, rejectCall } = useCallStore();
  const router = useRouter();

  if (!isIncoming || !incomingCallData) return null;

  const handleAccept = () => {
    router.push({
      pathname: '/call/[id]',
      params: {
        id: incomingCallData.callId,
        type: incomingCallData.type,
        workspaceId: incomingCallData.workspaceId || '',
        workspaceSlug: incomingCallData.workspaceSlug || '',
      },
    });
  };

  return (
    <View className="absolute top-12 left-4 right-4 bg-discord-tertiary rounded-2xl p-4 shadow-2xl border border-discord-base z-50">
      <View className="flex-row items-center">
        <Image
          source={{ uri: incomingCallData.initiator.image || 'https://via.placeholder.com/150' }}
          className="w-12 h-12 rounded-full"
        />
        <View className="ml-3 flex-1">
          <Text className="text-discord-header font-bold text-lg">{incomingCallData.initiator.name}</Text>
          <Text className="text-discord-muted">Incoming {incomingCallData.type} call...</Text>
        </View>
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={rejectCall}
            className="w-10 h-10 bg-red-500 rounded-full items-center justify-center"
          >
            <MaterialIcons name="call-end" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleAccept}
            className="w-10 h-10 bg-green-500 rounded-full items-center justify-center"
          >
            <MaterialIcons name="call" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

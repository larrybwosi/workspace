import { Message, MessageMetadata } from "@repo/types";
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export function ApprovalMessage({ message, metadata }: { message: Message; metadata: MessageMetadata }) {
  const approvalData = (metadata?.approvalData as Record<string, string>) || {};
  const status = approvalData.status || 'pending';
  const title = approvalData.title || 'Approval Request';

  const getStatusColor = () => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/20 text-green-400';
      case 'rejected':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-amber-500/20 text-amber-400';
    }
  };

  return (
    <View className="bg-discord-tertiary rounded-lg border border-black/20 my-2 overflow-hidden">
      <View className="h-1 bg-amber-500" />
      <View className="p-4">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <MaterialIcons name="assignment" size={20} color="#5865F2" />
            <Text className="text-discord-header font-bold ml-2">{title}</Text>
          </View>
          <View className={`px-2 py-0.5 rounded-md ${getStatusColor().split(' ')[0]}`}>
            <Text className={`text-[10px] font-bold uppercase ${getStatusColor().split(' ')[1]}`}>{status}</Text>
          </View>
        </View>

        <Text className="text-discord-header text-sm mb-4 leading-5">{message.content}</Text>

        <View className="flex-row gap-2">
          <TouchableOpacity className="bg-green-600 px-4 py-2 rounded-md flex-1 items-center flex-row justify-center">
            <MaterialIcons name="check" size={18} color="white" />
            <Text className="text-white font-bold ml-2">Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity className="bg-discord-secondary px-4 py-2 rounded-md flex-1 items-center flex-row justify-center border border-black/20">
            <MaterialIcons name="close" size={18} color="#F23F42" />
            <Text className="text-red-400 font-bold ml-2">Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

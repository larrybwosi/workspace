import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Message, MessageMetadata } from '@repo/types';

export function CommentRequestMessage({ message, metadata }: { message: Message; metadata: MessageMetadata }) {
  const resourceMetadata = (metadata?.resourceMetadata as Record<string, string>) || {};

  return (
    <View className="bg-discord-tertiary rounded-lg border border-black/20 my-2 overflow-hidden">
      <View className="h-1 bg-blue-500" />
      <View className="p-4">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <MaterialIcons name="insert-drive-file" size={20} color="#5865F2" />
            <Text className="text-discord-header font-bold ml-2" numberOfLines={1}>
              {resourceMetadata.title || 'Feedback Requested'}
            </Text>
          </View>
        </View>

        <Text className="text-discord-header text-sm mb-4 leading-5">{message.content}</Text>

        {resourceMetadata.url && (
          <View className="bg-discord-secondary p-2 rounded-md border border-black/10 mb-4">
            <Text className="text-blue-400 text-xs" numberOfLines={1}>
              {resourceMetadata.url}
            </Text>
          </View>
        )}

        <TouchableOpacity className="bg-discord-secondary py-2 rounded-md items-center flex-row justify-center border border-black/20">
          <MaterialIcons name="chat-bubble-outline" size={18} color="#949BA4" />
          <Text className="text-discord-header font-bold ml-2">Add Comment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

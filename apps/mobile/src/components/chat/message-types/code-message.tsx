import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export function CodeMessage({ message, metadata }: any) {
  const code = metadata?.code || message.content;
  const language = metadata?.language || 'text';
  const fileName = metadata?.fileName;

  return (
    <View className="bg-discord-tertiary rounded-lg overflow-hidden border border-black/20 my-2">
      <View className="bg-discord-secondary px-3 py-2 flex-row justify-between items-center border-b border-black/10">
        <View className="flex-row items-center">
          <MaterialIcons name="code" size={16} color="#949BA4" />
          <Text className="text-discord-header text-xs font-bold ml-2 uppercase">
            {fileName || `${language} snippet`}
          </Text>
        </View>
        <TouchableOpacity>
          <MaterialIcons name="content-copy" size={16} color="#949BA4" />
        </TouchableOpacity>
      </View>
      <ScrollView horizontal className="p-3">
        <Text className="text-discord-header font-mono text-sm leading-5">{code}</Text>
      </ScrollView>
    </View>
  );
}

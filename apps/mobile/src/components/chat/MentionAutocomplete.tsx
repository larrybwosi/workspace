import React from 'react';
import { View, Text, TouchableOpacity, FlatList, Image } from 'react-native';

interface MentionAutocompleteProps {
  isVisible: boolean;
  users: any[];
  onSelect: (user: any) => void;
}

export function MentionAutocomplete({ isVisible, users, onSelect }: MentionAutocompleteProps) {
  if (!isVisible || users.length === 0) return null;

  return (
    <View className="absolute bottom-full left-0 right-0 bg-discord-secondary border-t border-discord-tertiary max-h-48 shadow-lg overflow-hidden rounded-t-2xl mx-2 mb-2">
      <View className="px-4 py-2 bg-discord-tertiary">
        <Text className="text-discord-muted text-[10px] font-bold uppercase">Members</Text>
      </View>
      <FlatList
        data={users}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => onSelect(item)}
            className="flex-row items-center px-4 py-2 border-b border-discord-tertiary active:bg-discord-tertiary"
          >
            <View className="w-8 h-8 rounded-full bg-discord-blurple overflow-hidden">
              {item.image ? (
                <Image source={{ uri: item.image }} className="w-full h-full" />
              ) : (
                <View className="w-full h-full items-center justify-center">
                  <Text className="text-white text-xs font-bold">{item.name?.charAt(0)}</Text>
                </View>
              )}
            </View>
            <Text className="text-discord-header ml-3 font-medium">{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

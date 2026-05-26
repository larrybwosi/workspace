import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const EMOJI_DATA = [
  { category: 'Recent', emojis: ['👍', '❤️', '😂', '😮', '😢', '🔥', '✅', '🚀', '✨', '🙏'] },
  {
    category: 'Smileys',
    emojis: [
      '😀',
      '😃',
      '😄',
      '😁',
      '😆',
      '😅',
      '🤣',
      '😂',
      '🙂',
      '🙃',
      '😉',
      '😊',
      '😇',
      '🥰',
      '😍',
      '🤩',
      '😘',
      '😗',
      '😚',
      '😋',
      '😛',
      '😜',
      '🤪',
      '😝',
      '🤑',
      '🤗',
      '🤭',
      '🤫',
      '🤔',
    ],
  },
  {
    category: 'Gestures',
    emojis: [
      '👋',
      '🤚',
      '🖐',
      '✋',
      '🖖',
      '👌',
      '🤏',
      '✌️',
      '🤞',
      '🤟',
      '🤘',
      '🤙',
      '👈',
      '👉',
      '👆',
      '🖕',
      '👇',
      '☝️',
      '👍',
      '👎',
      '✊',
      '👊',
      '🤛',
      '🤜',
      '👏',
      '🙌',
      '👐',
      '🤲',
      '🤝',
      '🙏',
    ],
  },
  {
    category: 'Activities',
    emojis: [
      '⚽️',
      '🏀',
      '🏈',
      '⚾️',
      '🥎',
      '🎾',
      '🏐',
      '🏉',
      '🥏',
      '🎱',
      '🪀',
      '🏓',
      '🏸',
      '🏒',
      '🏑',
      '🥍',
      '🏏',
      '🥅',
      '⛳️',
      '🪁',
      '🏹',
      '🎣',
      '🤿',
      '🥊',
      '🥋',
      '🎽',
      '🛹',
    ],
  },
];

interface EmojiPickerProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
}

export function EmojiPicker({ isVisible, onClose, onSelect }: EmojiPickerProps) {
  const [search, setSearch] = useState('');

  const renderCategory = ({ item }: { item: (typeof EMOJI_DATA)[0] }) => (
    <View className="mb-4">
      <Text className="text-discord-muted text-xs font-bold uppercase mb-2 px-4">{item.category}</Text>
      <View className="flex-row flex-wrap px-2">
        {item.emojis.map((emoji: string) => (
          <TouchableOpacity
            key={emoji}
            onPress={() => {
              onSelect(emoji);
              onClose();
            }}
            className="w-[12.5%] aspect-square items-center justify-center"
          >
            <Text className="text-2xl">{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <Modal visible={isVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-discord-base">
        <View className="h-14 flex-row items-center px-4 border-b border-discord-tertiary">
          <Text className="flex-1 text-discord-header font-bold text-lg">Pick an Emoji</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#DBDEE1" />
          </TouchableOpacity>
        </View>

        <View className="p-4">
          <View className="bg-discord-tertiary flex-row items-center px-3 rounded-lg border border-black/20">
            <MaterialIcons name="search" size={20} color="#949BA4" />
            <TextInput
              className="flex-1 text-discord-header py-2 ml-2"
              placeholder="Search Emojis"
              placeholderTextColor="#949BA4"
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        <FlatList
          data={EMOJI_DATA}
          keyExtractor={item => item.category}
          renderItem={renderCategory}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      </View>
    </Modal>
  );
}

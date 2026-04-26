import React from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '✅', '🚀'];

interface ReactionPickerProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
}

export function ReactionPicker({ isVisible, onClose, onSelect }: ReactionPickerProps) {
  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/20 items-center justify-center"
        onPress={onClose}
      >
        <View className="bg-white p-4 rounded-2xl shadow-xl flex-row gap-2">
          {EMOJIS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              onPress={() => {
                onSelect(emoji);
                onClose();
              }}
              className="w-10 h-10 items-center justify-center bg-surface-container-low rounded-full"
            >
              <Text className="text-xl">{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

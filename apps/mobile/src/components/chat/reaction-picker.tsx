import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { EmojiPicker } from './EmojiPicker';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '✅', '🚀'];

interface ReactionPickerProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
}

export function ReactionPicker({ isVisible, onClose, onSelect }: ReactionPickerProps) {
  const [showFullPicker, setShowFullPicker] = useState(false);

  return (
    <>
      <Modal transparent visible={isVisible && !showFullPicker} animationType="fade" onRequestClose={onClose}>
        <Pressable className="flex-1 bg-black/40 items-center justify-center px-4" onPress={onClose}>
          <View className="bg-discord-secondary p-4 rounded-2xl shadow-xl w-full border border-black/20">
            <Text className="text-discord-muted text-xs font-bold uppercase mb-3 px-1">Quick Reactions</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {QUICK_EMOJIS.map(emoji => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => {
                    onSelect(emoji);
                    onClose();
                  }}
                  className="w-12 h-12 items-center justify-center bg-discord-tertiary rounded-xl border border-black/10"
                >
                  <Text className="text-2xl">{emoji}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => setShowFullPicker(true)}
                className="w-12 h-12 items-center justify-center bg-discord-tertiary rounded-xl border border-black/10"
              >
                <MaterialIcons name="add" size={24} color="#DBDEE1" />
              </TouchableOpacity>
            </View>

            <View className="border-t border-discord-tertiary pt-2">
              <TouchableOpacity className="flex-row items-center p-3 rounded-lg active:bg-discord-tertiary">
                <MaterialIcons name="reply" size={20} color="#B5BAC1" />
                <Text className="text-discord-header ml-3 font-medium">Reply</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-row items-center p-3 rounded-lg active:bg-discord-tertiary">
                <MaterialIcons name="edit" size={20} color="#B5BAC1" />
                <Text className="text-discord-header ml-3 font-medium">Edit Message</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-row items-center p-3 rounded-lg active:bg-discord-tertiary">
                <MaterialIcons name="content-copy" size={20} color="#B5BAC1" />
                <Text className="text-discord-header ml-3 font-medium">Copy Text</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-row items-center p-3 rounded-lg active:bg-discord-tertiary">
                <MaterialIcons name="delete" size={20} color="#F23F42" />
                <Text className="text-red-400 ml-3 font-medium">Delete Message</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      <EmojiPicker
        isVisible={showFullPicker}
        onClose={() => {
          setShowFullPicker(false);
          onClose();
        }}
        onSelect={onSelect}
      />
    </>
  );
}

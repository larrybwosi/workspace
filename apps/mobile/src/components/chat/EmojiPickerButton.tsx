import React, { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { EmojiPicker } from './EmojiPicker';

interface EmojiPickerButtonProps {
  onSelect: (emoji: string) => void;
}

export function EmojiPickerButton({ onSelect }: EmojiPickerButtonProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <>
      <TouchableOpacity onPress={() => setIsVisible(true)} className="mx-2">
        <MaterialIcons name="sentiment-satisfied" size={24} color="#949BA4" />
      </TouchableOpacity>

      <EmojiPicker
        isVisible={isVisible}
        onClose={() => setIsVisible(false)}
        onSelect={onSelect}
      />
    </>
  );
}

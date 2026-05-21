import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useCreateWorkspace } from '@repo/api-client';

export function CreateWorkspaceModal({ isVisible, onClose }: { isVisible: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const { mutate: createWorkspace, isPending } = useCreateWorkspace();

  const handleCreate = () => {
    if (!name.trim()) return;
    createWorkspace(
      { name, slug: name.toLowerCase().replace(/\s+/g, '-') },
      {
        onSuccess: () => {
          setName('');
          onClose();
        },
      }
    );
  };

  return (
    <Modal visible={isVisible} animationType="slide">
      <SafeAreaView className="flex-1 bg-discord-base">
        <View className="flex-row items-center justify-between p-4 border-b border-discord-tertiary">
          <TouchableOpacity onPress={onClose}>
            <Text className="text-discord-muted">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-discord-header font-bold text-lg">Create a Server</Text>
          <View className="w-10" />
        </View>

        <View className="p-6 items-center">
          <View className="w-20 h-20 rounded-full bg-discord-tertiary items-center justify-center mb-6">
            <MaterialIcons name="camera-alt" size={32} color="#949BA4" />
          </View>

          <View className="w-full">
            <Text className="text-discord-muted uppercase font-bold text-xs mb-2">Server Name</Text>
            <TextInput
              className="bg-discord-tertiary text-discord-header p-4 rounded-lg mb-6"
              value={name}
              onChangeText={setName}
              placeholder="My Awesome Server"
              placeholderTextColor="#949BA4"
            />

            <TouchableOpacity
              className={`w-full py-4 rounded-lg items-center ${name.trim() ? 'bg-discord-blurple' : 'bg-discord-blurple/50'}`}
              disabled={!name.trim() || isPending}
              onPress={handleCreate}
            >
              {isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">Create Server</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

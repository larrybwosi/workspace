import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, Switch } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useCreateChannel } from '@repo/api-client';

export function CreateChannelModal({
  isVisible,
  onClose,
  workspaceId,
}: {
  isVisible: boolean;
  onClose: () => void;
  workspaceId: string;
}) {
  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const { mutate: createChannel, isPending } = useCreateChannel(workspaceId);

  const handleCreate = () => {
    if (!name.trim()) return;
    createChannel(
      { name, type: isPrivate ? 'PRIVATE' : 'PUBLIC' },
      {
        onSuccess: () => {
          setName('');
          setIsPrivate(false);
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
          <Text className="text-discord-header font-bold text-lg">Create Channel</Text>
          <View className="w-10" />
        </View>

        <View className="p-6">
          <Text className="text-discord-muted uppercase font-bold text-xs mb-2">Channel Name</Text>
          <View className="flex-row items-center bg-discord-tertiary rounded-lg mb-6 px-4">
            <MaterialIcons name="tag" size={20} color="#949BA4" />
            <TextInput
              className="flex-1 text-discord-header p-4"
              value={name}
              onChangeText={setName}
              placeholder="new-channel"
              placeholderTextColor="#949BA4"
            />
          </View>

          <View className="flex-row items-center justify-between mb-8 bg-discord-sidebar p-4 rounded-lg">
            <View>
              <View className="flex-row items-center">
                <MaterialIcons name="lock" size={20} color="#DBDEE1" />
                <Text className="text-discord-header font-bold ml-2">Private Channel</Text>
              </View>
              <Text className="text-discord-muted text-xs mt-1">Only selected members can view this channel</Text>
            </View>
            <Switch value={isPrivate} onValueChange={setIsPrivate} trackColor={{ false: '#72767D', true: '#23A559' }} />
          </View>

          <TouchableOpacity
            className={`w-full py-4 rounded-lg items-center ${name.trim() ? 'bg-discord-blurple' : 'bg-discord-blurple/50'}`}
            disabled={!name.trim() || isPending}
            onPress={handleCreate}
          >
            {isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">Create Channel</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

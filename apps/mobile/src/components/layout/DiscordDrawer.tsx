import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useWorkspaces, useChannels } from '@repo/api-client';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { CreateWorkspaceModal } from './CreateWorkspaceModal';
import { CreateChannelModal } from './CreateChannelModal';

export function DiscordSidebar() {
  const { data: workspaces } = useWorkspaces();
  const { workspaceId } = useLocalSearchParams<{ workspaceId: string }>();
  const router = useRouter();
  const [isWorkspaceModalVisible, setWorkspaceModalVisible] = useState(false);
  const [isChannelModalVisible, setChannelModalVisible] = useState(false);

  return (
    <View className="flex-row h-full">
      <CreateWorkspaceModal isVisible={isWorkspaceModalVisible} onClose={() => setWorkspaceModalVisible(false)} />

      {/* Workspace Icons (Leftmost) */}
      <View className="w-16 bg-discord-tertiary pt-12 items-center">
        <TouchableOpacity
          className="w-12 h-12 bg-discord-blurple rounded-2xl items-center justify-center mb-2"
          onPress={() => router.push('/(tabs)/dms')}
        >
          <MaterialIcons name="chat-bubble" size={24} color="white" />
        </TouchableOpacity>

        <View className="w-8 h-[2px] bg-discord-sidebar/50 mb-2 rounded-full" />

        <ScrollView showsVerticalScrollIndicator={false} className="w-full">
          {(workspaces as any[])?.map(w => (
            <TouchableOpacity
              key={w.id}
              className={`w-12 h-12 mb-2 items-center justify-center self-center ${workspaceId === w.id ? 'rounded-xl bg-discord-blurple' : 'rounded-3xl bg-discord-sidebar'}`}
              onPress={() => router.push({ pathname: '/(tabs)/workspaces', params: { workspaceId: w.id } })}
            >
              {w.icon ? (
                <Image source={{ uri: w.icon }} className="w-full h-full rounded-inherit" />
              ) : (
                <Text className="text-white font-bold">{w.name.charAt(0)}</Text>
              )}
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            className="w-12 h-12 rounded-3xl bg-discord-sidebar items-center justify-center self-center mb-2"
            onPress={() => setWorkspaceModalVisible(true)}
          >
            <MaterialIcons name="add" size={24} color="#23A559" />
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Channels List (Second sidebar) */}
      <View className="flex-1 bg-discord-sidebar pt-12 px-2">
        {workspaceId ? (
          <>
            <View className="flex-row items-center justify-between px-2 mb-4">
              <Text className="text-discord-header font-bold text-lg flex-1" numberOfLines={1}>
                {(workspaces as any[])?.find(w => w.id === workspaceId)?.name}
              </Text>
              <TouchableOpacity onPress={() => setChannelModalVisible(true)}>
                <MaterialIcons name="add" size={20} color="#949BA4" />
              </TouchableOpacity>
            </View>
            <ChannelList workspaceId={workspaceId} />
            <CreateChannelModal
              isVisible={isChannelModalVisible}
              onClose={() => setChannelModalVisible(false)}
              workspaceId={workspaceId}
            />
          </>
        ) : (
          <View className="flex-1 items-center justify-center px-4">
            <Text className="text-discord-muted text-center italic">Select a server to see channels</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function ChannelList({ workspaceId }: { workspaceId: string }) {
  const { data: channels } = useChannels();
  const router = useRouter();
  const { id: activeChannelId } = useLocalSearchParams<{ id: string }>();

  return (
    <ScrollView>
      {(channels as any[])?.map(c => (
        <TouchableOpacity
          key={c.id}
          className={`flex-row items-center p-2 rounded-md mb-1 ${activeChannelId === c.id ? 'bg-discord-bg/50' : ''}`}
          onPress={() => router.push({ pathname: '/chat/[id]', params: { id: c.id, workspaceId } })}
        >
          <MaterialIcons
            name={c.type === 'PUBLIC' ? 'tag' : 'lock'}
            size={20}
            color="#949BA4"
            style={{ marginRight: 8 }}
          />
          <Text className={`font-medium ${activeChannelId === c.id ? 'text-discord-header' : 'text-discord-muted'}`}>
            {c.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

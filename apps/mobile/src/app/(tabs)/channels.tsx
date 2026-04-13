import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useChannels, useWorkspaces } from '@repo/api-client';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function Channels() {
  const { workspaceId } = useLocalSearchParams<{ workspaceId: string }>();
  const { data: workspaces } = useWorkspaces();
  const { data: channels, isLoading } = useChannels();
  const router = useRouter();

  const activeWorkspace = workspaces?.find((w: any) => w.id === workspaceId);

  if (!workspaceId) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <MaterialIcons name="work-outline" size={64} color="#5f5e5e" />
        <Text className="text-xl font-bold mt-4 text-center">Select a workspace first</Text>
        <TouchableOpacity
          className="mt-6 bg-primary px-6 py-3 rounded-lg"
          onPress={() => router.push('/(tabs)/workspaces')}
        >
          <Text className="text-white font-bold">Go to Workspaces</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text>Loading channels...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background p-4 pt-12">
      <View className="flex-row items-center mb-6">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <MaterialIcons name="arrow-back" size={24} color="#5f5e5e" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-on-surface flex-1" numberOfLines={1}>
          {activeWorkspace?.name || 'Channels'}
        </Text>
      </View>

      <FlatList
        data={channels}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="flex-row items-center p-4 mb-2 bg-white rounded-xl border border-surface-container"
            onPress={() => router.push({
                pathname: `/chat/${item.id}`,
                params: { workspaceId }
            })}
          >
            <MaterialIcons
              name={item.type === 'PUBLIC' ? 'tag' : 'lock'}
              size={20}
              color="#5f5e5e"
              style={{ marginRight: 12 }}
            />
            <Text className="text-lg font-medium text-on-surface">{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

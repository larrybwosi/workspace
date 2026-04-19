import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useDiscoverWorkspaces, useJoinWorkspace } from '@repo/api-client';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function DiscoverWorkspaces() {
  const { data: workspaces, isLoading } = useDiscoverWorkspaces();
  const { mutate: joinWorkspace, isPending: isJoining } = useJoinWorkspace();
  const router = useRouter();

  const handleJoin = (slug: string) => {
    joinWorkspace(slug, {
      onSuccess: () => {
        router.push(`/(tabs)/workspaces`);
      }
    });
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#2a3439" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background p-4 pt-12">
      <View className="flex-row items-center mb-6">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <MaterialIcons name="arrow-back" size={24} color="#5f5e5e" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-on-surface">Discover Workspaces</Text>
      </View>

      <FlatList
        data={workspaces}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            className="flex-row items-center p-4 mb-3 bg-white rounded-xl border border-surface-container shadow-sm"
          >
            <View className="w-12 h-12 rounded-lg bg-primary/10 items-center justify-center mr-4 overflow-hidden">
               {item.icon ? (
                 <Image source={{ uri: item.icon }} className="w-full h-full" />
               ) : (
                 <Text className="text-primary font-bold text-xl">{item.name.charAt(0)}</Text>
               )}
            </View>
            <View className="flex-1">
              <Text className="text-lg font-semibold text-on-surface">{item.name}</Text>
              <Text className="text-sm text-on-surface-variant">{item._count?.members || 0} members</Text>
            </View>
            <TouchableOpacity
              className="bg-primary px-4 py-2 rounded-lg"
              onPress={() => handleJoin(item.slug)}
              disabled={isJoining}
            >
              <Text className="text-white font-bold">Join</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <MaterialIcons name="search-off" size={64} color="#5f5e5e" />
            <Text className="text-on-surface-variant mt-4">No new workspaces found</Text>
          </View>
        }
      />
    </View>
  );
}

import { View, Text, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useWorkspaces } from '@repo/api-client';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function DiscoverWorkspaces() {
  const { data: workspaces, isLoading } = useWorkspaces();
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-discord-base">
      <View className="flex-row items-center p-4 border-b border-discord-tertiary">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <MaterialIcons name="arrow-back" size={24} color="#DBDEE1" />
        </TouchableOpacity>
        <Text className="text-discord-header font-bold text-xl">Discover Communities</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#5865F2" />
        </View>
      ) : (
        <FlatList
          data={workspaces as { id: string; name: string; slug: string }[]}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }: { item: any }) => (
            <TouchableOpacity
              className="bg-discord-sidebar p-4 rounded-xl mb-3 flex-row items-center"
              onPress={() => router.push({ pathname: '/(tabs)/workspaces', params: { workspaceId: item.id } })}
            >
              <View className="w-12 h-12 rounded-xl bg-discord-tertiary items-center justify-center mr-4">
                <Text className="text-white font-bold">{item.name.charAt(0)}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-discord-header font-bold text-lg">{item.name}</Text>
                <Text className="text-discord-muted text-sm">{item.slug}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#949BA4" />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

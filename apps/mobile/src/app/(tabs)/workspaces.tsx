import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { useWorkspaces } from '@repo/api-client';
import { useRouter } from 'expo-router';

export default function Workspaces() {
  const { data: workspaces, isLoading } = useWorkspaces();
  const router = useRouter();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text>Loading workspaces...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background p-4 pt-12">
      <Text className="text-2xl font-bold mb-6 text-on-surface">Workspaces</Text>
      <FlatList
        data={workspaces}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="flex-row items-center p-4 mb-3 bg-white rounded-xl border border-surface-container shadow-sm"
            onPress={() => router.push(`/(tabs)/channels?workspaceId=${item.id}`)}
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
              <Text className="text-sm text-on-surface-variant">{item.slug}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

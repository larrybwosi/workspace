import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { useDMConversations } from '@repo/api-client';
import { useRouter } from 'expo-router';
import { useSession } from '../../lib/auth';

export default function DMs() {
  const { data: conversations, isLoading } = useDMConversations();
  const { data: session } = (useSession as any)();
  const router = useRouter();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text>Loading conversations...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background p-4 pt-12">
      <Text className="text-2xl font-bold mb-6 text-on-surface">Direct Messages</Text>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          // Find the other user in the conversation
          const otherUser = item.participants?.find((p: any) => p.user.id !== session?.user?.id)?.user;

          return (
            <TouchableOpacity
              className="flex-row items-center p-4 mb-2 bg-white rounded-xl border border-surface-container"
              onPress={() => router.push(`/chat/${item.id}?isDM=true`)}
            >
              <View className="w-12 h-12 rounded-full bg-surface-container items-center justify-center mr-4 overflow-hidden">
                {otherUser?.image ? (
                  <Image source={{ uri: otherUser.image }} className="w-full h-full" />
                ) : (
                  <Text className="text-on-surface font-bold">{otherUser?.name?.charAt(0)}</Text>
                )}
              </View>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-on-surface">{otherUser?.name || 'Unknown User'}</Text>
                {item.lastMessage && (
                  <Text className="text-sm text-on-surface-variant" numberOfLines={1}>
                    {item.lastMessage.content}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-on-surface-variant">No conversations yet</Text>
          </View>
        }
      />
    </View>
  );
}

import { View, Text, FlatList, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { useDMConversations } from '@repo/api-client';
import { useRouter } from 'expo-router';
import { useSession } from '../../lib/auth';
import { MaterialIcons } from '@expo/vector-icons';

export default function DMs() {
  const { data: conversations } = useDMConversations();
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-discord-base">
      <View className="p-4 border-b border-discord-tertiary">
        <Text className="text-discord-header text-2xl font-bold">Direct Messages</Text>
      </View>

      <FlatList
        data={conversations as unknown[]}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }: { item: any }) => {
          const otherUser = (item.participants as any[])?.find((p: any) => p.user.id !== session?.user?.id)?.user;

          return (
            <TouchableOpacity
              className="flex-row items-center p-3 mb-2 bg-discord-sidebar/30 rounded-xl"
              onPress={() => router.push(`/chat/${item.id}?isDM=true`)}
            >
              <View className="w-12 h-12 rounded-full bg-discord-tertiary items-center justify-center mr-3 overflow-hidden">
                {otherUser?.image ? (
                  <Image source={{ uri: otherUser.image }} className="w-full h-full" />
                ) : (
                  <Text className="text-discord-muted font-bold">{otherUser?.name?.charAt(0)}</Text>
                )}
                {/* Online Status Indicator */}
                <View className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-discord-green border-2 border-discord-bg" />
              </View>
              <View className="flex-1">
                <Text className="text-discord-header font-semibold text-lg">{otherUser?.name || 'Unknown User'}</Text>
                {item.lastMessage && (
                  <Text className="text-discord-muted text-sm" numberOfLines={1}>
                    {item.lastMessage.content}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <MaterialIcons name="chat-bubble-outline" size={64} color="#949BA4" />
            <Text className="text-discord-muted mt-4">No active conversations</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

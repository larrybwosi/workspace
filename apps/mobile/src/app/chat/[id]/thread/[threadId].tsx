import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  useMessages,
  useReplyToMessage,
  useChannels,
  useWorkspaces,
  messageKeys,
  useAddReaction,
  useRemoveReaction
} from '@repo/api-client';
import { useSession } from '../../../../lib/auth';
import { ReactionPicker } from '../../../../components/chat/reaction-picker';
import { formatTime, getAblyClient, AblyChannels, AblyEvents } from '@repo/shared';
import { useQueryClient } from '@tanstack/react-query';

export default function ThreadScreen() {
  const { id, threadId, workspaceId } = useLocalSearchParams<{ id: string; threadId: string; workspaceId?: string }>();
  const router = useRouter();
  const { data: session } = (useSession as any)();
  const [messageText, setMessageText] = useState('');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(id as string, workspaceId, threadId);

  const { mutate: replyToMessage } = useReplyToMessage(workspaceId);
  const { mutate: addReaction } = useAddReaction();
  const { mutate: removeReaction } = useRemoveReaction();
  const { data: channels } = useChannels();
  const { data: workspaces } = useWorkspaces();
  const queryClient = useQueryClient();

  // Ably real-time integration
  useEffect(() => {
    const ably = getAblyClient();
    if (!ably || !id) return;

    const channelName = AblyChannels.channel(id);
    const ablyChannel = ably.channels.get(channelName);

    const handleMessage = () => {
        queryClient.invalidateQueries({
          queryKey: messageKeys.list(id as string, workspaceId, threadId)
        });
    };

    ablyChannel.subscribe(AblyEvents.MESSAGE_SENT, handleMessage);
    ablyChannel.subscribe(AblyEvents.MESSAGE_UPDATED, handleMessage);
    ablyChannel.subscribe(AblyEvents.MESSAGE_DELETED, handleMessage);

    return () => {
        ablyChannel.unsubscribe(AblyEvents.MESSAGE_SENT, handleMessage);
        ablyChannel.unsubscribe(AblyEvents.MESSAGE_UPDATED, handleMessage);
        ablyChannel.unsubscribe(AblyEvents.MESSAGE_DELETED, handleMessage);
    };
  }, [id, queryClient, workspaceId, threadId]);

  const channel = channels?.find((c: any) => c.id === id);
  const workspace = workspaces?.find((w: any) => w.id === workspaceId);

  const messages = messagesData?.pages.flatMap((page: any) => page.messages) || [];
  const parentMessage = messages.find((m: any) => m.id === threadId);
  const replies = messages.filter((m: any) => m.id !== threadId);

  const handleSend = () => {
    if (!messageText.trim()) return;

    replyToMessage({
      messageId: threadId as string,
      channelId: id as string,
      content: messageText,
      mentions: [],
    });
    setMessageText('');
  };

  const renderMessage = ({ item: message }: { item: any }) => {
    const isMe = message.userId === session?.user?.id;
    const isParent = message.id === threadId;

    const handleLongPress = () => {
        setSelectedMessageId(message.id);
    };

    const toggleReaction = (emoji: string) => {
        const hasReacted = message.reactions?.some((r: any) => r.emoji === emoji && r.users?.some((u: any) => u.id === session?.user?.id));

        if (hasReacted) {
            removeReaction({
                messageId: message.id,
                emoji,
                channelId: id as string,
                workspaceSlug: workspaceId
            });
        } else {
            addReaction({
                messageId: message.id,
                emoji,
                channelId: id as string,
                workspaceSlug: workspaceId
            });
        }
    };

    return (
      <View className={`mb-6 ${isParent ? 'border-b border-surface-container pb-6' : ''}`}>
        <View className={`flex-row items-end gap-3 ${isMe ? 'flex-row-reverse self-end max-w-[85%]' : 'self-start max-w-[85%]'}`}>
          {!isMe && (
            <View className="w-8 h-8 rounded-lg overflow-hidden bg-surface-container">
              {message.user?.image ? (
                <Image source={{ uri: message.user.image }} className="w-full h-full" />
              ) : (
                <View className="w-full h-full items-center justify-center bg-primary/10">
                  <Text className="text-[10px] font-bold text-primary">{message.user?.name?.charAt(0)}</Text>
                </View>
              )}
            </View>
          )}
          <View className={`gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
            <TouchableOpacity
                onLongPress={handleLongPress}
                activeOpacity={0.8}
                className={`p-4 rounded-xl shadow-sm ${isMe ? 'bg-primary rounded-tr-none' : 'bg-surface-container-low rounded-tl-none border border-outline-variant/10'}`}
            >
              <Text className={`font-body text-sm leading-relaxed ${isMe ? 'text-on-primary' : 'text-on-surface'}`}>
                {message.content}
              </Text>
            </TouchableOpacity>
            <Text className="text-[10px] font-medium text-on-surface-variant/70 px-1">
              {!isMe && `${message.user?.name} • `}{formatTime(message.timestamp)}
            </Text>
          </View>
        </View>

        {/* Reactions Display */}
        {message.reactions && message.reactions.length > 0 && (
            <View className={`flex-row flex-wrap gap-1 mt-2 ${isMe ? 'justify-end' : 'ml-11'}`}>
                {message.reactions.map((r: any) => (
                    <TouchableOpacity
                        key={r.emoji}
                        onPress={() => toggleReaction(r.emoji)}
                        className={`px-2 py-1 rounded-full flex-row items-center gap-1 border ${r.users?.some((u: any) => u.id === session?.user?.id) ? 'bg-primary/10 border-primary/30' : 'bg-surface-container-low border-outline-variant/20'}`}
                    >
                        <Text className="text-xs">{r.emoji}</Text>
                        <Text className="text-[10px] font-bold text-on-surface-variant">{r.count}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        )}
        {isParent && (
            <Text className="mt-4 text-xs font-bold text-on-surface-variant/50 uppercase tracking-widest">
                Replies
            </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ReactionPicker
        isVisible={!!selectedMessageId}
        onClose={() => setSelectedMessageId(null)}
        onSelect={(emoji) => {
            if (selectedMessageId) {
                addReaction({
                    messageId: selectedMessageId,
                    emoji,
                    channelId: id as string,
                    workspaceSlug: workspaceId
                });
            }
        }}
      />
      <View className="h-16 flex-row items-center justify-between px-4 bg-white border-b border-surface-container">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()}>
             <MaterialIcons name="arrow-back" size={24} color="#5f5e5e" />
          </TouchableOpacity>
          <View>
            <Text className="font-body font-semibold text-lg tracking-tight text-on-surface">Thread</Text>
            <Text className="text-[10px] font-headline font-bold uppercase tracking-widest text-primary/60">
                # {channel?.name || ''}
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        inverted
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 24 }}
        onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
            }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator className="my-4" /> : null}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <View className="px-4 py-3 bg-white border-t border-surface-container-high">
          <View className="flex-row items-center gap-3">
            <View className="flex-1 bg-surface-container-low px-4 py-2 rounded-lg flex-row items-center gap-3">
              <TextInput
                className="flex-1 text-sm font-body text-on-surface"
                placeholder="Reply to thread..."
                placeholderTextColor="#5f5f6180"
                value={messageText}
                onChangeText={setMessageText}
                multiline
              />
            </View>
            <TouchableOpacity
                className={`w-10 h-10 items-center justify-center rounded-lg shadow-sm ${messageText.trim() ? 'bg-primary' : 'bg-surface-container-high'}`}
                onPress={handleSend}
                disabled={!messageText.trim()}
            >
              <MaterialIcons name="send" size={20} color={messageText.trim() ? '#f7f7ff' : '#5f5f61'} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

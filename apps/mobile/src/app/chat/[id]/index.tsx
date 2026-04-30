import React, { useState, useRef, useEffect } from 'react';
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
  useSendMessage,
  useChannels,
  useWorkspaces,
  useDMConversations,
  messageKeys,
  useAddReaction,
  useRemoveReaction,
  useUploadFile,
} from '@repo/api-client';
import { useSession } from '../../../lib/auth';
import * as DocumentPicker from 'expo-document-picker';
import { ReactionPicker } from '../../../components/chat/reaction-picker';
import { formatTime, getAblyClient, AblyChannels, AblyEvents } from '@repo/shared';
import { useQueryClient } from '@tanstack/react-query';

export default function ChatScreen() {
  const { id, workspaceId, isDM } = useLocalSearchParams<{ id: string; workspaceId?: string; isDM?: string }>();
  const router = useRouter();
  const { data: session } = (useSession as any)();
  const [messageText, setMessageText] = useState('');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: messagesData, fetchNextPage, hasNextPage, isFetchingNextPage } = useMessages(id as string, workspaceId);

  const { mutate: sendMessage } = useSendMessage(workspaceId);
  const { mutate: addReaction } = useAddReaction();
  const { mutate: removeReaction } = useRemoveReaction();
  const { mutateAsync: uploadFile } = useUploadFile();
  const { data: channels } = useChannels();
  const { data: workspaces } = useWorkspaces();
  const { data: dms } = useDMConversations();
  const queryClient = useQueryClient();

  // Real-time integration
  useEffect(() => {
    if (!id) return;

    const channelName = isDM ? AblyChannels.dm(id) : AblyChannels.channel(id);

    const handleMessage = () => {
      // Invalidate messages query to fetch new messages
      queryClient.invalidateQueries({
        queryKey: messageKeys.list(id as string, workspaceId),
      });
    };

    realtime.subscribe(channelName, AblyEvents.MESSAGE_SENT, handleMessage);
    realtime.subscribe(channelName, AblyEvents.MESSAGE_UPDATED, handleMessage);
    realtime.subscribe(channelName, AblyEvents.MESSAGE_DELETED, handleMessage);

    return () => {
      realtime.unsubscribe(channelName, AblyEvents.MESSAGE_SENT, handleMessage);
      realtime.unsubscribe(channelName, AblyEvents.MESSAGE_UPDATED, handleMessage);
      realtime.unsubscribe(channelName, AblyEvents.MESSAGE_DELETED, handleMessage);
    };
  }, [id, isDM, queryClient, workspaceId]);

  const channel = channels?.find((c: any) => c.id === id);
  const workspace = workspaces?.find((w: any) => w.id === workspaceId);
  const dm = dms?.find((d: any) => d.id === id);

  const messages = messagesData?.pages.flatMap((page: any) => page.messages) || [];

  const handleSend = () => {
    if (!messageText.trim()) return;

    sendMessage({
      channelId: id as string,
      content: messageText,
      mentions: [],
    });
    setMessageText('');
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setIsUploading(true);
        const asset = result.assets[0];

        // Convert to File object for the hook
        const file = new File([await (await fetch(asset.uri)).blob()], asset.name, { type: asset.mimeType });

        await uploadFile({
          file,
          entityType: 'message',
          entityId: id as string, // Temporary mapping until message is created
        });

        // Send message with attachment info in content for now
        sendMessage({
          channelId: id as string,
          content: `${messageText}\n\n📎 Attached: ${asset.name}`,
          mentions: [],
        });

        setIsUploading(false);
      }
    } catch (error) {
      console.error('File pick error:', error);
      setIsUploading(false);
    }
  };

  const renderMessage = ({ item: message }: { item: any }) => {
    const isMe = message.userId === session?.user?.id;

    const handleLongPress = () => {
      setSelectedMessageId(message.id);
    };

    const toggleReaction = (emoji: string) => {
      const hasReacted = message.reactions?.some(
        (r: any) => r.emoji === emoji && r.users?.some((u: any) => u.id === session?.user?.id)
      );

      if (hasReacted) {
        removeReaction({
          messageId: message.id,
          emoji,
          channelId: id as string,
          workspaceSlug: workspaceId,
        });
      } else {
        addReaction({
          messageId: message.id,
          emoji,
          channelId: id as string,
          workspaceSlug: workspaceId,
        });
      }
    };

    return (
      <View className="mb-6">
        <View
          className={`flex-row items-end gap-3 ${isMe ? 'flex-row-reverse self-end max-w-[85%]' : 'self-start max-w-[85%]'}`}
        >
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
              {!isMe && `${message.user?.name} • `}
              {formatTime(message.timestamp)}
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
        {message.replyCount > 0 && (
          <TouchableOpacity
            className={`mt-2 ${isMe ? 'self-end' : 'ml-11'}`}
            onPress={() =>
              router.push({
                pathname: `/chat/[id]/thread/[threadId]`,
                params: { id: id as string, threadId: message.id, workspaceId },
              } as any)
            }
          >
            <Text className="text-xs font-bold text-primary">
              {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const getTitle = () => {
    if (isDM) {
      const otherUser = dm?.participants?.find((p: any) => p.user.id !== session?.user?.id)?.user;
      return otherUser?.name || 'Direct Message';
    }
    return channel?.name || 'Chat';
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ReactionPicker
        isVisible={!!selectedMessageId}
        onClose={() => setSelectedMessageId(null)}
        onSelect={emoji => {
          if (selectedMessageId) {
            addReaction({
              messageId: selectedMessageId,
              emoji,
              channelId: id as string,
              workspaceSlug: workspaceId,
            });
          }
        }}
      />
      {/* TopAppBar */}
      <View className="h-16 flex-row items-center justify-between px-4 bg-white border-b border-surface-container">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#5f5e5e" />
          </TouchableOpacity>
          <View>
            <Text className="font-body font-semibold text-lg tracking-tight text-on-surface">{getTitle()}</Text>
            <Text className="text-[10px] font-headline font-bold uppercase tracking-widest text-primary/60">
              {isDM ? 'Active Now' : `# ${workspace?.name || ''}`}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            className="w-10 h-10 items-center justify-center rounded-lg"
            onPress={() => router.push(`/chat/${id}/info`)}
          >
            <MaterialIcons name="info-outline" size={24} color="#5f5e5e" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={messages}
        keyExtractor={item => item.id}
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

      {/* Chat Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View className="px-4 py-3 bg-white border-t border-surface-container-high">
          {isUploading && (
            <View className="flex-row items-center gap-2 mb-2 px-2">
              <ActivityIndicator size="small" color="#5f5f61" />
              <Text className="text-xs text-on-surface-variant font-medium">Uploading file...</Text>
            </View>
          )}
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              className="w-10 h-10 items-center justify-center bg-surface-container-low rounded-lg"
              onPress={handlePickFile}
              disabled={isUploading}
            >
              <MaterialIcons name="add-circle" size={24} color={isUploading ? '#5f5f6150' : '#5f5f61'} />
            </TouchableOpacity>
            <View className="flex-1 bg-surface-container-low px-4 py-2 rounded-lg flex-row items-center gap-3">
              <TextInput
                className="flex-1 text-sm font-body text-on-surface"
                placeholder="Type a message..."
                placeholderTextColor="#5f5f6180"
                value={messageText}
                onChangeText={setMessageText}
                multiline
              />
              <TouchableOpacity>
                <MaterialIcons name="sentiment-satisfied" size={20} color="#5f5f61" />
              </TouchableOpacity>
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

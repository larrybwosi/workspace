import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
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
  useWorkspaceChannels,
  messageKeys,
  useAddReaction,
  useRemoveReaction,
  useStorageUpload,
} from '@repo/api-client';
import { useSession } from '../../../lib/auth';
import * as DocumentPicker from 'expo-document-picker';
import { ReactionPicker } from '../../../components/chat/reaction-picker';
import { SwipeableMessage } from '../../../components/chat/swipeable-message';
import { formatTime, realtime, AblyChannels, AblyEvents, extractUserMentions } from '@repo/shared';
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Message, Channel } from '@repo/types';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChatScreen() {
  const {
    id,
    workspaceId,
    isDM: isDMParam,
  } = useLocalSearchParams<{ id: string; workspaceId?: string; isDM?: string }>();
  const isDM = isDMParam === 'true';
  const router = useRouter();
  const { data: session } = (useSession as any)();

  // Combined State
  const [messageText, setMessageText] = useState('');
  const [attachments, setAttachments] = useState<{ uri: string; name: string; type: string }[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: messagesData, fetchNextPage, hasNextPage, isFetchingNextPage } = useMessages(id as string, workspaceId);

  const { mutate: sendMessage } = useSendMessage(workspaceId);
  const { mutate: addReaction } = useAddReaction();
  const { mutate: removeReaction } = useRemoveReaction();
  const { mutateAsync: uploadFile } = useStorageUpload();

  const { data: workspaces } = useWorkspaces();
  const activeWorkspace = (workspaces as any[])?.find(w => w.id === workspaceId);

  const { data: channels } = useChannels();
  const { data: workspaceChannels } = useWorkspaceChannels(activeWorkspace?.slug);
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

  const messages = messagesData?.pages.flatMap(page => page.messages) || [];

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setAttachments([
        ...attachments,
        {
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          type: asset.mimeType || 'image/jpeg',
        },
      ]);
    }
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

        const uploadedFile = await uploadFile({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/octet-stream',
        });

        sendMessage({
          channelId: id as string,
          content: messageText,
          mentions: [],
          attachments: [uploadedFile],
        });

        setIsUploading(false);
      }
    } catch (error) {
      console.error('File pick error:', error);
      setIsUploading(false);
    }
  };

  const handleSend = async () => {
    if (!messageText.trim() && attachments.length === 0) return;

    const uploadedAttachments = [];
    if (attachments.length > 0) {
      setIsUploading(true);
      try {
        for (const attachment of attachments) {
          const result = await uploadFile({
            uri: attachment.uri,
            name: attachment.name,
            type: attachment.type,
          });
          uploadedAttachments.push(result);
        }
      } catch (error) {
        console.error('Upload failed', error);
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    const mentions = extractUserMentions(messageText);

    sendMessage({
      channelId: id as string,
      content: messageText,
      mentions: mentions,
      attachments: uploadedAttachments,
    });
    setMessageText('');
    setAttachments([]);
  };

  const renderMessage = ({ item: message }: { item: Message }) => {
    const isMe = message.userId === (session?.user?.id || (session as any)?.user?.id);

    const handleLongPress = () => {
      setSelectedMessageId(message.id);
    };

    const toggleReaction = (emoji: string) => {
      const hasReacted = message.reactions?.some(
        r => r.emoji === emoji && r.users?.some((u: any) => (u.id || u) === session?.user?.id)
      );

      const payload = {
        messageId: message.id,
        emoji,
        channelId: id as string,
        workspaceSlug: workspaceId,
      };

      if (hasReacted) {
        removeReaction(payload);
      } else {
        addReaction(payload);
      }
    };

    return (
      <SwipeableMessage
        onReply={() => {
          setMessageText(`@${message.user?.name} `);
        }}
        onReact={handleLongPress}
      >
        <View className="mb-6 px-4">
          <View
            className={`flex-row items-end gap-3 ${isMe ? 'flex-row-reverse self-end max-w-[85%]' : 'self-start max-w-[85%]'}`}
          >
            {!isMe && (
              <View className="w-8 h-8 rounded-lg overflow-hidden bg-surface-container">
                {message.user?.image || message.user?.avatar ? (
                  <Image source={{ uri: message.user.image || message.user.avatar }} className="w-full h-full" />
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
                {message.attachments?.map((att, index) => (
                  <View key={index} className="mb-2">
                    {att.type?.startsWith('image/') ? (
                      <Image source={{ uri: att.url }} className="w-48 h-32 rounded-lg" />
                    ) : (
                      <View className="flex-row items-center bg-surface-container p-2 rounded-lg">
                        <MaterialIcons name="insert-drive-file" size={20} color="#5f5e5e" />
                        <Text className="ml-2 text-xs" numberOfLines={1}>
                          {att.name}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}

                <Text className={`font-body text-sm leading-relaxed ${isMe ? 'text-on-primary' : 'text-on-surface'}`}>
                  {message.content}
                </Text>
              </TouchableOpacity>

              <View className="flex-row items-center gap-2 px-1">
                <Text className="text-[10px] font-medium text-on-surface-variant/70">
                  {!isMe && `${message.user?.name} • `}
                  {formatTime(message.timestamp)}
                </Text>
                {message.replyCount !== undefined && message.replyCount > 0 && (
                  <TouchableOpacity
                    onPress={() =>
                      router.push(`/chat/${id}/thread/${message.id}?workspaceId=${workspaceId}`)
                    }
                  >
                    <Text className="text-[10px] font-bold text-primary">
                      {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {message.reactions && message.reactions.length > 0 && (
            <View className={`flex-row flex-wrap gap-1 mt-2 ${isMe ? 'justify-end' : 'ml-11'}`}>
              {message.reactions.map(r => (
                <TouchableOpacity
                  key={r.emoji}
                  onPress={() => toggleReaction(r.emoji)}
                  className={`px-2 py-1 rounded-full flex-row items-center gap-1 border ${r.users?.some((u: any) => (u.id || u) === session?.user?.id) ? 'bg-primary/10 border-primary/30' : 'bg-surface-container-low border-outline-variant/20'}`}
                >
                  <Text className="text-xs">{r.emoji}</Text>
                  <Text className="text-[10px] font-bold text-on-surface-variant">{r.count}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </SwipeableMessage>
    );
  };

  const getTitle = () => {
    if (isDM) {
      const dmData = (dms as any[])?.find(d => d.id === id);
      const otherUser = dmData?.user || dmData?.participants?.find((p: any) => p.user?.id !== session?.user?.id)?.user;
      return otherUser?.name || 'Direct Message';
    }
    const currentChannel =
      (workspaceChannels as Channel[])?.find(c => c.id === id) || (channels as Channel[])?.find(c => c.id === id);
    return currentChannel?.name || 'Chat';
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ReactionPicker
        isVisible={!!selectedMessageId}
        onClose={() => setSelectedMessageId(null)}
        onSelect={emoji => {
          if (selectedMessageId) {
            addReaction({ messageId: selectedMessageId, emoji, channelId: id as string, workspaceSlug: workspaceId });
          }
        }}
      />

      <View className="h-16 flex-row items-center justify-between px-4 bg-white border-b border-surface-container">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#5f5e5e" />
          </TouchableOpacity>
          <View>
            <Text className="font-body font-semibold text-lg tracking-tight text-on-surface">{getTitle()}</Text>
            <Text className="text-[10px] font-headline font-bold uppercase tracking-widest text-primary/60">
              {isDM ? 'Active Now' : `# ${activeWorkspace?.name || ''}`}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.push(`/chat/${id}/info`)}>
          <MaterialIcons name="info-outline" size={24} color="#5f5e5e" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        inverted
        contentContainerStyle={{ paddingVertical: 24 }}
        onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator className="my-4" /> : null}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
      >
        {attachments.length > 0 && (
          <View className="px-4 py-2 bg-surface-container-low flex-row gap-2">
            {attachments.map((att, index) => (
              <View key={index} className="relative">
                <Image source={{ uri: att.uri }} className="w-16 h-16 rounded-lg" />
                <TouchableOpacity
                  className="absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 items-center justify-center"
                  onPress={() => setAttachments(attachments.filter((_, i) => i !== index))}
                >
                  <MaterialIcons name="close" size={14} color="white" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

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
              onPress={pickImage}
              disabled={isUploading}
            >
              <MaterialIcons name="image" size={24} color={isUploading ? '#5f5f6150' : '#5f5f61'} />
            </TouchableOpacity>

            <TouchableOpacity
              className="w-10 h-10 items-center justify-center bg-surface-container-low rounded-lg"
              onPress={handlePickFile}
              disabled={isUploading}
            >
              <MaterialIcons name="add-circle" size={24} color={isUploading ? '#5f5f6150' : '#5f5f61'} />
            </TouchableOpacity>

            <View className="flex-1 bg-surface-container-low px-4 py-2 rounded-lg">
              <TextInput
                className="text-sm font-body text-on-surface"
                placeholder="Type a message..."
                value={messageText}
                onChangeText={setMessageText}
                multiline
              />
            </View>

            <TouchableOpacity
              className={`w-10 h-10 items-center justify-center rounded-lg shadow-sm ${(messageText.trim() || attachments.length > 0) && !isUploading ? 'bg-primary' : 'bg-surface-container-high'}`}
              onPress={handleSend}
              disabled={(!messageText.trim() && attachments.length === 0) || isUploading}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="#f7f7ff" />
              ) : (
                <MaterialIcons
                  name="send"
                  size={20}
                  color={messageText.trim() || attachments.length > 0 ? '#f7f7ff' : '#5f5f61'}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

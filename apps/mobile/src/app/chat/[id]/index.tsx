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
  useWorkspaceMembers,
  useWorkspaceChannels,
  useStorageUpload,
  messageKeys
} from '@repo/api-client';
import { useSession } from '../../../lib/auth';
import { formatTime, getAblyClient, AblyChannels, AblyEvents, extractUserMentions } from '@repo/shared';
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';

export default function ChatScreen() {
  const { id, workspaceId, isDM: isDMParam } = useLocalSearchParams<{ id: string; workspaceId?: string; isDM?: string }>();
  const isDM = isDMParam === 'true';
  const router = useRouter();
  const { data: session } = (useSession as any)();
  const [messageText, setMessageText] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(id as string, workspaceId);

  const { mutate: sendMessage } = useSendMessage(workspaceId);
  const { data: workspaces } = useWorkspaces();
  const activeWorkspace = workspaces?.find((w: any) => w.id === workspaceId);

  const { data: channels } = useChannels();
  const { data: workspaceChannels } = useWorkspaceChannels(activeWorkspace?.slug);
  const { data: workspaceMembers } = useWorkspaceMembers(activeWorkspace?.slug);

  const { data: dms } = useDMConversations();
  const { mutateAsync: uploadFile } = useStorageUpload();
  const queryClient = useQueryClient();

  // Ably real-time integration
  useEffect(() => {
    const ably = getAblyClient();
    if (!ably || !id) return;

    const channelName = isDM ? AblyChannels.dm(id) : AblyChannels.channel(id);
    const ablyChannel = ably.channels.get(channelName);

    const handleMessage = () => {
        // Invalidate messages query to fetch new messages
        queryClient.invalidateQueries({
          queryKey: messageKeys.list(id as string, workspaceId)
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
  }, [id, isDM, queryClient, workspaceId]);

  const channel = channels?.find((c: any) => c.id === id);
  const workspace = workspaces?.find((w: any) => w.id === workspaceId);
  const dm = dms?.find((d: any) => d.id === id);

  const messages = messagesData?.pages.flatMap((page: any) => page.messages) || [];

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setAttachments([...attachments, {
        uri: asset.uri,
        name: asset.fileName || `image_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      }]);
    }
  };

  const handleSend = async () => {
    if (!messageText.trim() && attachments.length === 0) return;

    let uploadedAttachments = [];
    if (attachments.length > 0) {
      setIsUploading(true);
      try {
        for (const attachment of attachments) {
          const result = await uploadFile(attachment);
          uploadedAttachments.push({
            name: result.name,
            type: result.type,
            url: result.url,
            size: result.size,
          });
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

  const renderMessage = ({ item: message }: { item: any }) => {
    const isMe = message.userId === session?.user?.id;

    return (
      <View className={`flex-row items-end gap-3 mb-6 ${isMe ? 'flex-row-reverse self-end max-w-[85%]' : 'self-start max-w-[85%]'}`}>
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
          <View className={`p-4 rounded-xl shadow-sm ${isMe ? 'bg-primary rounded-tr-none' : 'bg-surface-container-low rounded-tl-none border border-outline-variant/10'}`}>
            {message.attachments?.map((att: any, index: number) => (
              <View key={index} className="mb-2">
                {att.type.startsWith('image/') ? (
                  <Image source={{ uri: att.url }} className="w-48 h-32 rounded-lg" />
                ) : (
                  <View className="flex-row items-center bg-surface-container p-2 rounded-lg">
                    <MaterialIcons name="insert-drive-file" size={20} color="#5f5e5e" />
                    <Text className="ml-2 text-xs" numberOfLines={1}>{att.name}</Text>
                  </View>
                )}
              </View>
            ))}
            <Text className={`font-body text-sm leading-relaxed ${isMe ? 'text-on-primary' : 'text-on-surface'}`}>
              {message.content}
            </Text>
          </View>
          <Text className="text-[10px] font-medium text-on-surface-variant/70 px-1">
            {!isMe && `${message.user?.name} • `}{formatTime(message.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  const getTitle = () => {
    if (isDM) {
        const otherUser = dm?.user || dm?.participants?.find((p: any) => p.user.id !== session?.user?.id)?.user;
        return otherUser?.name || 'Direct Message';
    }
    const currentChannel = workspaceChannels?.find((c: any) => c.id === id) || channels?.find((c: any) => c.id === id);
    return currentChannel?.name || 'Chat';
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
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

      {/* Chat Input Area */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}>
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
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              className="w-10 h-10 items-center justify-center bg-surface-container-low rounded-lg"
              onPress={pickImage}
            >
              <MaterialIcons name="add-circle" size={24} color="#5f5f61" />
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
                className={`w-10 h-10 items-center justify-center rounded-lg shadow-sm ${(messageText.trim() || attachments.length > 0) && !isUploading ? 'bg-primary' : 'bg-surface-container-high'}`}
                onPress={handleSend}
                disabled={(!messageText.trim() && attachments.length === 0) || isUploading}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="#f7f7ff" />
              ) : (
                <MaterialIcons name="send" size={20} color={(messageText.trim() || attachments.length > 0) ? '#f7f7ff' : '#5f5f61'} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

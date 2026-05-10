import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  useMessages,
  useSendMessage,
  useWorkspaces,
  useChannels,
  useDMConversations,
  useAddReaction,
  useStorageUpload,
} from '@repo/api-client';
import { realtime } from '@repo/shared';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSession } from '../../../lib/auth';
import { DiscordMessage } from '../../../components/chat/DiscordMessage';
import { ReactionPicker } from '../../../components/chat/reaction-picker';

export default function ChatScreen() {
  const { id, workspaceId, isDM: isDMParam } = useLocalSearchParams<{ id: string; workspaceId: string, isDM: string }>();
  const isDM = isDMParam === 'true';
  const router = useRouter();
  const { data: session } = (useSession as any)();

  const { data: messagesData, fetchNextPage, hasNextPage, isFetchingNextPage } = useMessages(id as string);
  const messages = messagesData?.pages.flatMap(page => page.messages) || [];

  const { mutate: sendMessage } = useSendMessage();
  const { mutate: addReaction } = useAddReaction();
  const { mutateAsync: uploadFile } = useStorageUpload();

  const [messageText, setMessageText] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});

  const { data: workspaces } = useWorkspaces();
  const { data: channels } = useChannels();
  const { data: dms } = useDMConversations();

  const activeChannel = channels?.find((c: any) => c.id === id);
  const activeDM = dms?.find((d: any) => d.id === id);

  // Real-time "Typing" indicator
  useEffect(() => {
    if (!id) return;

    const channelName = isDM ? `dm:${id}` : `channel:${id}`;

    realtime.subscribe(channelName, 'typing', (data: any) => {
      if (data.userId === session?.user?.id) return;

      setTypingUsers(prev => ({
        ...prev,
        [data.userId]: data.userName
      }));

      setTimeout(() => {
        setTypingUsers(prev => {
          const newState = { ...prev };
          delete newState[data.userId];
          return newState;
        });
      }, 3000);
    });

    return () => {
      realtime.unsubscribe(channelName, 'typing', () => {});
    };
  }, [id, isDM, session?.user?.id]);

  const handleTextChange = (text: string) => {
    setMessageText(text);
    if (text.length > 0 && id) {
       const channelName = isDM ? `dm:${id}` : `channel:${id}`;
       realtime.publish(channelName, 'typing', { userId: session?.user?.id, userName: session?.user?.name });
    }
  };

  const handleSend = async () => {
    if (!messageText.trim() && attachments.length === 0) return;

    sendMessage({
      channelId: id as string,
      content: messageText,
      attachments: attachments.map(a => ({ id: Math.random().toString(), url: a.url, name: a.name, type: a.type })),
      mentions: [],
    });

    setMessageText('');
    setAttachments([]);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled) {
      setIsUploading(true);
      try {
        const file = result.assets[0];
        const uploaded = await uploadFile({
          uri: file.uri,
          name: file.fileName || 'image.jpg',
          type: 'image/jpeg',
        } as any);
        setAttachments([...attachments, { url: uploaded.url, name: file.fileName || 'image.jpg', type: 'image/jpeg' }]);
      } catch (err) {
        console.error(err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const startCall = (type: 'voice' | 'video') => {
    const otherUser = activeDM?.participants?.find((p: any) => p.user?.id !== session?.user?.id)?.user;

    router.push({
      pathname: '/call/[id]',
      params: {
        id: 'new', // The CallScreen will handle creating a new call
        type,
        workspaceId: workspaceId || '',
        recipientId: otherUser?.id || '',
        channelId: isDM ? '' : id
      }
    } as any);
  };

  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    const nextMessage = messages[index + 1];
    const isSameUser = nextMessage?.user?.id === item.user?.id &&
                      (new Date(item.timestamp).getTime() - new Date(nextMessage.timestamp).getTime() < 300000);

    return (
      <DiscordMessage
        message={item}
        isSameUser={isSameUser}
        onLongPress={setSelectedMessageId}
        onReply={() => setMessageText(`@${item.user?.name} `)}
        onReact={(emoji: string) => {
             addReaction({ messageId: item.id, emoji, channelId: id as string });
        }}
      />
    );
  };

  const getTitle = () => {
    if (isDM) {
        const otherUser = activeDM?.participants?.find((p: any) => p.user?.id !== session?.user?.id)?.user;
        return otherUser?.name || 'Direct Message';
    }
    return activeChannel?.name || 'Chat';
  };

  const typingNames = Object.values(typingUsers);

  return (
    <SafeAreaView className="flex-1 bg-discord-base">
      <ReactionPicker
        isVisible={!!selectedMessageId}
        onClose={() => setSelectedMessageId(null)}
        onSelect={emoji => {
          if (selectedMessageId) {
            addReaction({ messageId: selectedMessageId, emoji, channelId: id as string });
          }
        }}
      />

      <View className="h-14 flex-row items-center px-4 border-b border-discord-tertiary">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <MaterialIcons name="arrow-back" size={24} color="#DBDEE1" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-discord-header font-bold text-lg" numberOfLines={1}>
            {isDM ? '' : '# '}{getTitle()}
          </Text>
        </View>
        <View className="flex-row gap-4">
          <TouchableOpacity onPress={() => startCall('voice')}>
            <MaterialIcons name="call" size={24} color="#949BA4" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => startCall('video')}>
            <MaterialIcons name="videocam" size={24} color="#949BA4" />
          </TouchableOpacity>
          <TouchableOpacity>
            <MaterialIcons name="people" size={24} color="#949BA4" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        inverted
        onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator className="my-4" /> : null}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View className="bg-discord-base">
           {typingNames.length > 0 && (
             <View className="px-4 py-1">
                <Text className="text-discord-header text-[10px] font-bold">
                   {typingNames.length === 1
                     ? `${typingNames[0]} is typing...`
                     : `${typingNames.length} people are typing...`}
                </Text>
             </View>
           )}

           <View className="p-3">
              {isUploading && (
                <View className="flex-row items-center mb-2 px-2">
                  <ActivityIndicator size="small" color="#5865F2" />
                  <Text className="text-discord-muted ml-2 text-xs">Uploading file...</Text>
                </View>
              )}
              {attachments.length > 0 && (
                <View className="flex-row gap-2 mb-2">
                  {attachments.map((att, idx) => (
                    <View key={idx} className="relative">
                      <Image source={{ uri: att.url }} className="w-16 h-16 rounded-lg" />
                      <TouchableOpacity
                        className="absolute -top-1 -right-1 bg-red-500 rounded-full"
                        onPress={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                      >
                        <MaterialIcons name="close" size={16} color="white" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <View className="flex-row items-center bg-discord-tertiary rounded-full px-4 py-2">
                <TouchableOpacity onPress={pickImage} className="mr-2">
                  <MaterialIcons name="add-circle" size={24} color="#949BA4" />
                </TouchableOpacity>

                <TextInput
                  className="flex-1 text-discord-header py-1"
                  placeholder={`Message ${isDM ? '@' : '#'}${getTitle()}`}
                  placeholderTextColor="#949BA4"
                  value={messageText}
                  onChangeText={handleTextChange}
                  multiline
                />

                {(messageText.trim() || attachments.length > 0) && (
                  <TouchableOpacity onPress={handleSend}>
                    <MaterialIcons name="send" size={24} color="#5865F2" />
                  </TouchableOpacity>
                )}
              </View>
           </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  useMessages,
  useSendMessage,
<<<<<<< HEAD
  useWorkspaces,
=======

>>>>>>> 2162c4e4c246182311b63e68f6998e8baad44cc6
  useChannels,
  useDMConversations,
  useAddReaction,
  useStorageUpload,
  useWorkspaceMembers,
} from '@repo/api-client';
import { realtime } from '@repo/shared';
import { MaterialIcons } from '@expo/vector-icons';
<<<<<<< HEAD
import * as ImagePicker from 'expo-image-picker';
import { useSession } from '../../../lib/auth';
import { DiscordMessage } from '../../../components/chat/DiscordMessage';
import { ReactionPicker } from '../../../components/chat/reaction-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChatScreen() {
  const {
    id,
    workspaceId,
    isDM: isDMParam,
  } = useLocalSearchParams<{ id: string; workspaceId: string; isDM: string }>();
=======
import * as DocumentPicker from 'expo-document-picker';
import { useSession } from '../../../lib/auth';
import { DiscordMessage } from '../../../components/chat/DiscordMessage';
import { ReactionPicker } from '../../../components/chat/reaction-picker';
import { EmojiPickerButton } from '../../../components/chat/EmojiPickerButton';
import { MentionAutocomplete } from '../../../components/chat/MentionAutocomplete';

export default function ChatScreen() {
  const { id, workspaceId, isDM: isDMParam } = useLocalSearchParams<{ id: string; workspaceId: string, isDM: string }>();
>>>>>>> 2162c4e4c246182311b63e68f6998e8baad44cc6
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
<<<<<<< HEAD
=======

  const [mentionSearch, setMentionSearch] = useState<string | null>(null);

  const { data: members } = useWorkspaceMembers(workspaceId || '');
>>>>>>> 2162c4e4c246182311b63e68f6998e8baad44cc6

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
<<<<<<< HEAD
        [data.userId]: data.userName,
=======
        [data.userId]: data.userName
>>>>>>> 2162c4e4c246182311b63e68f6998e8baad44cc6
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
<<<<<<< HEAD

  const handleTextChange = (text: string) => {
    setMessageText(text);
    if (text.length > 0 && id) {
      const channelName = isDM ? `dm:${id}` : `channel:${id}`;
      realtime.publish(channelName, 'typing', { userId: session?.user?.id, userName: session?.user?.name });
    }
=======

  const handleTextChange = (text: string) => {
    setMessageText(text);

    const words = text.split(' ');
    const lastWord = words[words.length - 1];

    if (lastWord.startsWith('@')) {
      setMentionSearch(lastWord.slice(1));
    } else {
      setMentionSearch(null);
    }

    if (text.length > 0 && id) {
       const channelName = isDM ? `dm:${id}` : `channel:${id}`;
       realtime.publish(channelName, 'typing', { userId: session?.user?.id, userName: session?.user?.name });
    }
  };

  const handleMentionSelect = (user: any) => {
    const words = messageText.split(' ');
    words[words.length - 1] = `@${user.name} `;
    setMessageText(words.join(' '));
    setMentionSearch(null);
>>>>>>> 2162c4e4c246182311b63e68f6998e8baad44cc6
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

<<<<<<< HEAD
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
=======
  const pickFiles = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: true,
      type: '*/*',
>>>>>>> 2162c4e4c246182311b63e68f6998e8baad44cc6
    });

    if (!result.canceled) {
      setIsUploading(true);
      try {
<<<<<<< HEAD
        const file = result.assets[0];
        const uploaded = await uploadFile({
          uri: file.uri,
          name: file.fileName || 'image.jpg',
          type: 'image/jpeg',
        } as any);
        setAttachments([...attachments, { url: uploaded.url, name: file.fileName || 'image.jpg', type: 'image/jpeg' }]);
=======
        const newAttachments = [...attachments];
        for (const asset of result.assets) {
          const uploaded = await uploadFile({
            uri: asset.uri,
            name: asset.name,
            type: asset.mimeType || 'application/octet-stream',
          } as any);
          newAttachments.push({ url: uploaded.url, name: asset.name, type: asset.mimeType });
        }
        setAttachments(newAttachments);
>>>>>>> 2162c4e4c246182311b63e68f6998e8baad44cc6
      } catch (err) {
        console.error(err);
      } finally {
        setIsUploading(false);
      }
    }
  };

<<<<<<< HEAD
  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    const nextMessage = messages[index + 1];
    const isSameUser =
      nextMessage?.user?.id === item.user?.id &&
      new Date(item.timestamp).getTime() - new Date(nextMessage.timestamp).getTime() < 300000;
=======
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
>>>>>>> 2162c4e4c246182311b63e68f6998e8baad44cc6

    return (
      <DiscordMessage
        message={item}
        isSameUser={isSameUser}
        onLongPress={setSelectedMessageId}
        onReply={() => setMessageText(`@${item.user?.name} `)}
        onReact={(emoji: string) => {
<<<<<<< HEAD
          addReaction({ messageId: item.id, emoji, channelId: id as string });
=======
             addReaction({ messageId: item.id, emoji, channelId: id as string });
>>>>>>> 2162c4e4c246182311b63e68f6998e8baad44cc6
        }}
      />
    );
  };

  const getTitle = () => {
    if (isDM) {
<<<<<<< HEAD
      const otherUser = activeDM?.participants?.find((p: any) => p.user?.id !== session?.user?.id)?.user;
      return otherUser?.name || 'Direct Message';
=======
        const otherUser = activeDM?.participants?.find((p: any) => p.user?.id !== session?.user?.id)?.user;
        return otherUser?.name || 'Direct Message';
>>>>>>> 2162c4e4c246182311b63e68f6998e8baad44cc6
    }
    return activeChannel?.name || 'Chat';
  };

<<<<<<< HEAD
=======
  const filteredMembers = members?.filter((m: any) =>
    m.user?.name?.toLowerCase().includes(mentionSearch?.toLowerCase() || '')
  ).map((m: any) => m.user) || [];

>>>>>>> 2162c4e4c246182311b63e68f6998e8baad44cc6
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
<<<<<<< HEAD
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-discord-header font-bold text-lg" numberOfLines={1}>
            {isDM ? '' : '# '}
            {getTitle()}
          </Text>
        </View>
        <TouchableOpacity>
          <MaterialIcons name="people" size={24} color="#949BA4" />
=======
>>>>>>> 2162c4e4c246182311b63e68f6998e8baad44cc6
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
<<<<<<< HEAD
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
=======
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
              <MentionAutocomplete
                isVisible={mentionSearch !== null}
                users={filteredMembers}
                onSelect={handleMentionSelect}
              />

              {isUploading && (
                <View className="flex-row items-center mb-2 px-2">
                  <ActivityIndicator size="small" color="#5865F2" />
                  <Text className="text-discord-muted ml-2 text-xs">Uploading files...</Text>
                </View>
              )}
              {attachments.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2 mb-2">
                  {attachments.map((att, idx) => (
                    <View key={idx} className="relative mr-2">
                      {att.type?.startsWith('image/') ? (
                        <Image source={{ uri: att.url }} className="w-20 h-20 rounded-lg" />
                      ) : (
                        <View className="w-20 h-20 bg-discord-tertiary rounded-lg items-center justify-center p-2 border border-black/10">
                           <MaterialIcons name="insert-drive-file" size={24} color="#949BA4" />
                           <Text className="text-discord-header text-[8px] text-center mt-1" numberOfLines={2}>{att.name}</Text>
                        </View>
                      )}
                      <TouchableOpacity
                        className="absolute -top-1 -right-1 bg-discord-secondary rounded-full p-0.5 border border-black/20"
                        onPress={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                      >
                        <MaterialIcons name="close" size={14} color="#F23F42" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}

              <View className="flex-row items-center bg-discord-tertiary rounded-2xl px-4 py-2">
                <TouchableOpacity onPress={pickFiles} className="mr-2">
                  <MaterialIcons name="add-circle" size={24} color="#949BA4" />
                </TouchableOpacity>

                <TextInput
                  className="flex-1 text-discord-header py-1 min-h-[36px]"
                  placeholder={`Message ${isDM ? '@' : '#'}${getTitle()}`}
                  placeholderTextColor="#949BA4"
                  value={messageText}
                  onChangeText={handleTextChange}
                  multiline
                />

                <EmojiPickerButton onSelect={(emoji) => setMessageText(prev => prev + emoji)} />

                {(messageText.trim() || attachments.length > 0) && (
                  <TouchableOpacity onPress={handleSend}>
                    <MaterialIcons name="send" size={24} color="#5865F2" />
                  </TouchableOpacity>
                )}
              </View>
           </View>
>>>>>>> 2162c4e4c246182311b63e68f6998e8baad44cc6
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

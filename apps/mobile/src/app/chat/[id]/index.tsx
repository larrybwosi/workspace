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
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  useMessages,
  useSendMessage,
  useChannels,
  useDMConversations,
  useAddReaction,
  useStorageUpload,
  useWorkspaceMembers,
} from '@repo/api-client';
import { realtime } from '@repo/shared';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useSession } from '../../../lib/auth';
import { DiscordMessage } from '../../../components/chat/DiscordMessage';
import { ReactionPicker } from '../../../components/chat/reaction-picker';
import { EmojiPickerButton } from '../../../components/chat/EmojiPickerButton';
import { MentionAutocomplete } from '../../../components/chat/MentionAutocomplete';

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

  const [mentionSearch, setMentionSearch] = useState<string | null>(null);

  const { data: members } = useWorkspaceMembers(workspaceId || '');

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

  const pickFiles = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: true,
      type: '*/*',
    });

    if (!result.canceled) {
      setIsUploading(true);
      try {
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
      } catch (err) {
        console.error(err);
      } finally {
        setIsUploading(false);
      }
    }
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

  const filteredMembers = members?.filter((m: any) =>
    m.user?.name?.toLowerCase().includes(mentionSearch?.toLowerCase() || '')
  ).map((m: any) => m.user) || [];

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
        <TouchableOpacity>
           <MaterialIcons name="people" size={24} color="#949BA4" />
        </TouchableOpacity>
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
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

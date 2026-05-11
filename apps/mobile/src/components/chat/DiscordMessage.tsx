import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { SwipeableMessage } from './swipeable-message';

export function DiscordMessage({ message, isSameUser, onLongPress, onReply, onReact }: any) {
  const timestamp = new Date(message.timestamp);
  const timeStr = format(timestamp, 'p');

  return (
    <SwipeableMessage onReply={onReply} onReact={() => onLongPress(message.id)}>
      <TouchableOpacity
        onLongPress={() => onLongPress(message.id)}
        activeOpacity={0.7}
        className={`flex-row px-4 ${isSameUser ? 'mt-0.5' : 'mt-4'}`}
      >
        <View className="w-10 mr-3">
          {!isSameUser && (
            <View className="w-10 h-10 rounded-full bg-discord-blurple overflow-hidden">
              {message.user?.image ? (
                <Image source={{ uri: message.user.image }} className="w-full h-full" />
              ) : (
                <View className="w-full h-full items-center justify-center">
                  <Text className="text-white font-bold">{message.user?.name?.charAt(0)}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View className="flex-1">
          {!isSameUser && (
            <View className="flex-row items-center mb-0.5">
              <Text className="text-discord-header font-bold mr-2 text-base">{message.user?.name}</Text>
              <Text className="text-discord-muted text-xs">{timeStr}</Text>
            </View>
          )}

          <View>
            {message.attachments?.map((att: any, idx: number) => (
              <View key={idx} className="mb-2">
                {att.type?.startsWith('image/') ? (
                  <Image source={{ uri: att.url }} className="w-full h-48 rounded-lg" resizeMode="cover" />
                ) : (
                  <View className="bg-discord-tertiary p-3 rounded-lg flex-row items-center">
                    <MaterialIcons name="insert-drive-file" size={24} color="#949BA4" />
                    <Text className="text-discord-header ml-2 flex-1" numberOfLines={1}>{att.name}</Text>
                  </View>
                )}
              </View>
            ))}
            <Text className="text-discord-header text-base leading-5">{message.content}</Text>
          </View>

          {message.reactions && message.reactions.length > 0 && (
            <View className="flex-row flex-wrap gap-1 mt-2">
              {message.reactions.map((r: any) => (
                <TouchableOpacity
                  key={r.emoji}
                  onPress={() => onReact(r.emoji)}
                  className="bg-discord-tertiary px-1.5 py-0.5 rounded-md flex-row items-center border border-transparent"
                >
                  <Text className="text-sm">{r.emoji}</Text>
                  <Text className="text-discord-muted text-xs ml-1 font-bold">{r.count}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>
    </SwipeableMessage>
  );
}

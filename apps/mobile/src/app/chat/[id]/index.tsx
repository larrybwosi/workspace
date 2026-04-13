import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, SafeAreaView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function WorkspaceChat() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* TopAppBar */}
      <View className="h-16 flex-row items-center justify-between px-4 bg-white border-b border-surface-container">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-lg overflow-hidden bg-surface-container-high border-2 border-surface-container">
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCzzTOfIxABemYxXDmPm6ikQiu5uUfGIq0SqPW9aZCLLMllwvccXbOZ485DCrzZtPgp0n0pQKDL4WuXrF71hQ9CLaq-T2nv0XaNQyFG-hiCiA8Yzz2PXFebSu0lUOWrBG4YjpVwEo_jf3MzyvoYqBU5M2ZUxiMM3S0c1UtPV_tiD1AgdKu5ZEe9spN9jMU3ZKwKJIJOjYqjnw5WvJ0Knk-ikIfSzBD9Daz1c1VlYzwetqU7ZGnMAU5xJ9SNW6a_nvK0vC3sKRFGO0c' }}
              className="w-full h-full"
            />
          </View>
          <View>
            <Text className="font-body font-semibold text-lg tracking-tight text-on-surface">Workspace</Text>
            <Text className="text-[10px] font-headline font-bold uppercase tracking-widest text-primary/60">Active Now</Text>
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          <TouchableOpacity className="w-10 h-10 items-center justify-center rounded-lg">
            <MaterialIcons name="search" size={24} color="#5f5e5e" />
          </TouchableOpacity>
          <TouchableOpacity
            className="w-10 h-10 items-center justify-center rounded-lg"
            onPress={() => router.push(`/chat/${id}/info`)}
          >
            <MaterialIcons name="more-vert" size={24} color="#5f5e5e" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 py-6" showsVerticalScrollIndicator={false}>
        {/* Date Marker */}
        <View className="flex-row justify-center mb-6">
          <View className="px-3 py-1 bg-surface-container-high rounded-full">
            <Text className="text-on-surface-variant font-bold text-[10px] uppercase tracking-widest">Wednesday, Oct 25</Text>
          </View>
        </View>

        {/* Incoming Message Bubble */}
        <View className="flex-row items-end gap-3 max-w-[85%] self-start mb-6">
          <View className="w-8 h-8 rounded-lg overflow-hidden bg-surface-container">
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAqKBv66RCnocJ7n3q4bK2kygukE5Ej6GBNnSXgQLcKNz3ieRSCjc1MjZgTkwIbtdgEVLQ6v-3jWwMrvyy4sC3ioDO1PyYroJ8C0zQwm6fjc2vJGXXme9R9vzNs_xW2M8Gxbgt5WObcYBuHpy16FVgrRdn0RYlecuyKlR9jaX0BYNcktWjvlM7YdqzvJEOaR38hyHsveafzQMUSuc5MedfFUCoFO0xdHn3iSFodh4xxWNfpNy-PSegCMARD_vtBLwOyGR_-0dC9SWo' }}
              className="w-full h-full"
            />
          </View>
          <View className="gap-1">
            <View className="bg-surface-container-low p-4 rounded-tr-xl rounded-br-xl rounded-tl-xl shadow-sm">
              <Text className="font-body text-sm leading-relaxed text-on-surface">
                Hi team, I've finished the initial wireframes for the new project dashboard. Can you take a look at the shared file and let me know your thoughts?
              </Text>
            </View>
            <Text className="text-[10px] font-medium text-on-surface-variant/70 px-1">Sarah M. • 09:15 AM</Text>
          </View>
        </View>

        {/* Outgoing Message Bubble */}
        <View className="flex-col gap-1 items-end max-w-[85%] self-end mb-6">
          <View className="bg-primary p-4 rounded-tr-xl rounded-tl-xl rounded-bl-xl shadow-sm">
            <Text className="font-body text-sm leading-relaxed text-on-primary">
              Checking it now! I'll focus on the architectural precision and the tonal layering we discussed yesterday.
            </Text>
          </View>
          <Text className="text-[10px] font-medium text-on-surface-variant/70 px-1">09:18 AM • Delivered</Text>
        </View>

        {/* Rich Link Preview Message (Incoming) */}
        <View className="flex-row items-end gap-3 max-w-[85%] self-start mb-6">
          <View className="w-8 h-8 rounded-lg overflow-hidden bg-surface-container">
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAKjMWMLQZ7z4McVT3pnQU-RO9irw4gKR88xzORv4uc3aZqdkCw4raDFF5f6c0cTrBZGutkb3dPhRkkfmCVYujRe-Pjzne8wfsVXMLpXoD9qBu8jwpOw8i3SgJlS2hSvZY0js8y2lAR-pMf2daNgeaODB4AwRVu4T1fONlY4PuPXS8K9P1LQ68x3wURWVcre3wOR2hsH1koKxWzLytBE7w9lTvNsutBtG272Z4-fRI6FZDet63PMOLg4iLKmkoC3S_hDP8kiqHqWtw' }}
              className="w-full h-full"
            />
          </View>
          <View className="gap-1 flex-1">
            <View className="bg-surface-container-low overflow-hidden rounded-tr-xl rounded-br-xl rounded-tl-xl shadow-sm border border-outline-variant/10">
              <View className="h-32 bg-surface-container-highest">
                <Image
                  source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8dtQQJ-CQyIn431krZUYQRMADMXTu6aB41w9ccctZLE6TPh86WjUo4u95tQTw2EIJA5uwvrY_SnFJDK4knm0V56qh0wt8EYFSl99C7YMiCMk9531zJEMVe91p1mG3PyZoHWCkv81l2zvQFDCYtfqJhCVk2NiuRb9qf4nqveixNQO0-yjCeqAhhdjtl1TcAU9AWA69M1glkz8GSfUonhUscU9p2MaYzqxTD7eZoOnXQLTjUgEo8lu7o9btnKul1QY6JsD8-zVDZo0' }}
                  className="w-full h-full"
                />
              </View>
              <View className="p-4">
                <Text className="font-headline font-bold text-sm text-on-surface mb-1">Dashboard_Final_v2.fig</Text>
                <Text className="font-body text-xs text-on-surface-variant mb-2" numberOfLines={2}>
                  Structural components updated with the new 0.25rem radius and tonal depth layers.
                </Text>
                <TouchableOpacity className="flex-row items-center gap-2">
                  <MaterialIcons name="description" size={14} color="#5a5e6c" />
                  <Text className="text-[10px] font-bold text-primary uppercase tracking-wider">Open in Figma</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text className="text-[10px] font-medium text-on-surface-variant/70 px-1">Sarah M. • 09:20 AM</Text>
          </View>
        </View>

        {/* Task Update */}
        <View className="flex-row items-center gap-4 py-2 mb-6">
          <View className="h-[1px] flex-1 bg-surface-container-high" />
          <View className="flex-row items-center gap-2 px-3 py-1 bg-secondary-container/30 border border-secondary-container/50 rounded-lg">
            <MaterialIcons name="assignment-turned-in" size={12} color="#5e5f65" />
            <Text className="text-[10px] font-bold text-secondary uppercase tracking-widest">Sarah updated Task: "Finalize Spacing"</Text>
          </View>
          <View className="h-[1px] flex-1 bg-surface-container-high" />
        </View>

        {/* Outgoing with Image */}
        <View className="flex-col gap-1 items-end max-w-[85%] self-end mb-10">
          <View className="bg-primary p-1 rounded-tr-xl rounded-tl-xl rounded-bl-xl shadow-sm overflow-hidden">
            <View className="rounded-lg overflow-hidden mb-1">
              <Image
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYTRIatbKAZAbiRLeNyWkt8wvJlMs7adhTR_q2ivIjkjUgrnkuXxj9DsKZbTtzl8euafiqTYTmnphpSfne4X1EvtsRv4Oas-dwT_K2E_To8Y1CCOu4pmiFd4C8d55Deewe4xI92OdxVc769Bc5RCmlmiyU6ZjvFzfqMqNSFH57RqTDy1fkMbMyqTCzOcJSPc_LP6Ch5CQ2H1itdc_pjGzNk152rmphguaGujCLGbSRiT7FXtBtLPbwd1XyjbekSbvpSAtv170VN_E' }}
                className="w-full h-52"
              />
            </View>
            <View className="p-3">
              <Text className="font-body text-sm leading-relaxed text-on-primary">
                Implemented the Tailwind config with the new tokens. It's looking very sharp.
              </Text>
            </View>
          </View>
          <Text className="text-[10px] font-medium text-on-surface-variant/70 px-1">09:25 AM • Read</Text>
        </View>
      </ScrollView>

      {/* Chat Input Area */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={64}>
        <View className="px-4 py-3 bg-white border-t border-surface-container-high">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity className="w-10 h-10 items-center justify-center bg-surface-container-low rounded-lg">
              <MaterialIcons name="add-circle" size={24} color="#5f5f61" />
            </TouchableOpacity>
            <View className="flex-1 bg-surface-container-low px-4 py-2 rounded-lg flex-row items-center gap-3">
              <TextInput
                className="flex-1 text-sm font-body text-on-surface"
                placeholder="Type a message..."
                placeholderTextColor="#5f5f6180"
              />
              <TouchableOpacity>
                <MaterialIcons name="sentiment-satisfied" size={20} color="#5f5f61" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity className="w-10 h-10 items-center justify-center bg-primary rounded-lg shadow-sm">
              <MaterialIcons name="send" size={20} color="#f7f7ff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

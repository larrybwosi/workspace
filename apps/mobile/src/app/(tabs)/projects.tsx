import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, SafeAreaView, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function ChannelsNavigation() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="h-16 flex-row items-center justify-between px-4 bg-[#f8f9fb] border-b border-surface-container">
        <View className="flex-row items-center gap-3">
          <View className="w-8 h-8 rounded-full overflow-hidden bg-secondary-container">
            <Image source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAVii3kvOymjzfWSaMHifu8Vz7DVDTR9oPBd_fojQUd984wt4mU1Wa0SynT6vbZcGBetJCHs_-6jhxdaG2XvyrsNqKPhlJu-LtJeL_A70HAN3m11c790K8PGn-Jr3jE9GxxIcUjFMhpomCCbRbK_uHMQdlIfsrKsS5XkRpjCNEG7aEg0epdzjPNO878GMmfM8nD6M78IgyrTxJu82kknmIKSXUHGyi1hGPfF6CCQRTg6HilW-Q0TKvmhn0SFD6AbJBd0FmRqscSz9U' }} className="w-full h-full" />
          </View>
          <Text className="font-body font-semibold text-lg tracking-tight text-on-background">Workspace</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <TouchableOpacity className="p-2"><MaterialIcons name="search" size={24} color="#5f5e5e" /></TouchableOpacity>
          <TouchableOpacity className="p-2"><MaterialIcons name="more-vert" size={24} color="#5f5e5e" /></TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>
        <View className="mb-8">
          <Text className="text-4xl font-headline font-extrabold tracking-tight text-on-surface mb-1">Channels</Text>
          <Text className="text-on-surface-variant text-sm font-medium mb-4">Manage and explore your workspace clusters</Text>
          <View className="relative">
            <View className="absolute left-3 top-3 z-10"><MaterialIcons name="search" size={18} color="#7b7a7d" /></View>
            <TextInput className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-b-2 border-outline text-sm font-medium" placeholder="Filter projects or tasks..." placeholderTextColor="#b3b1b4" />
          </View>
        </View>

        <View className="flex-row gap-6">
          <View className="w-1/3 gap-6">
            <View className="bg-surface-container p-4 rounded-lg">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-[8px] uppercase tracking-widest font-bold text-on-surface-variant">FAVORITES</Text>
                <MaterialIcons name="star" size={12} color="#5a5e6c" />
              </View>
              <View className="gap-2">
                <View className="flex-row items-center gap-2"><MaterialIcons name="tag" size={12} color="#7b7a7d" /><Text className="text-[10px] font-semibold text-on-surface">design-ops</Text></View>
                <View className="flex-row items-center gap-2"><MaterialIcons name="tag" size={12} color="#7b7a7d" /><Text className="text-[10px] font-semibold text-on-surface">q4-roadmap</Text></View>
                <View className="flex-row items-center gap-2"><MaterialIcons name="lock" size={12} color="#7b7a7d" /><Text className="text-[10px] font-semibold text-on-surface">executive-sync</Text></View>
              </View>
            </View>
            <View className="bg-surface-container-low p-4 rounded-lg border border-outline-variant/10">
              <Text className="text-[8px] uppercase tracking-widest font-bold text-on-surface-variant mb-4">QUICK STATS</Text>
              <View className="gap-2">
                <View><Text className="text-xl font-headline font-bold text-on-surface">24</Text><Text className="text-[8px] font-medium text-outline">Active Tasks</Text></View>
                <View><Text className="text-xl font-headline font-bold text-on-surface">08</Text><Text className="text-[8px] font-medium text-outline">Pending</Text></View>
              </View>
            </View>
          </View>

          <View className="flex-1 gap-4">
            <View className="flex-row items-center gap-2"><Text className="font-headline font-bold text-lg">Suggested</Text><View className="h-[1px] flex-grow bg-surface-container-high" /></View>
            {[
              { title: 'marketing-strategy', color: 'bg-tertiary-container', icon: 'campaign', text: 'Unified messaging for the Q1 launch.' },
              { title: 'dev-infrastructure', color: 'bg-primary-container', icon: 'terminal', text: 'Deployment logs and pipelines.' },
              { title: 'talent-acquisition', color: 'bg-secondary-container', icon: 'groups', text: 'Internal referrals and hiring updates.' }
            ].map((card, i) => (
              <View key={i} className="bg-surface-container-lowest border border-outline-variant/10 p-4 rounded-lg">
                <View className="flex-row justify-between items-start mb-3">
                  <View className={`w-8 h-8 ${card.color} items-center justify-center rounded`}><MaterialIcons name={card.icon} size={18} color="#2a3439" /></View>
                  <MaterialIcons name="add-circle" size={18} color="#7b7a7d" />
                </View>
                <Text className="font-bold text-xs mb-1">{card.title}</Text>
                <Text className="text-[10px] text-on-surface-variant leading-relaxed" numberOfLines={2}>{card.text}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="mt-8 mb-10">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="font-headline font-bold text-lg">All Channels</Text>
            <View className="flex-row gap-2">
              <View className="px-2 py-1 bg-surface-container rounded"><Text className="text-[8px] font-bold uppercase tracking-wider text-on-surface-variant">NAME</Text></View>
              <View className="px-2 py-1 rounded"><Text className="text-[8px] font-bold uppercase tracking-wider text-outline">RECENT</Text></View>
            </View>
          </View>

          <View className="bg-surface-container-lowest divide-y divide-surface-container rounded-xl overflow-hidden shadow-sm">
            {[
              { name: 'announcements-global', members: '420 members', label: 'Public', icon: 'tag' },
              { name: 'client-alpha-private', members: '12 members', label: 'Project', icon: 'lock', special: true },
              { name: 'general-discussion', members: '1.2k members', label: 'General', icon: 'tag', dot: true },
              { name: 'ux-research-lab', members: '85 members', label: 'Design', icon: 'tag' }
            ].map((row, i) => (
              <TouchableOpacity key={i} className="flex-row items-center justify-between p-4">
                <View className="flex-row items-center gap-4">
                  <MaterialIcons name={row.icon} size={20} color="#7b7a7d" />
                  <View>
                    <Text className="text-sm font-bold text-on-surface">{row.name}</Text>
                    <Text className="text-[10px] text-outline font-medium">{row.members}</Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-4">
                  {row.dot && <View className="w-2 h-2 bg-primary rounded-full" />}
                  <View className={`px-2 py-0.5 border ${row.special ? 'border-primary/30 bg-primary/5' : 'border-outline-variant/30'} rounded`}>
                    <Text className={`text-[8px] font-bold ${row.special ? 'text-primary' : 'text-outline-variant'} uppercase tracking-widest`}>{row.label}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity className="flex-row items-center justify-center gap-2 py-6">
            <MaterialIcons name="keyboard-arrow-down" size={16} color="#7b7a7d" />
            <Text className="text-[10px] font-bold uppercase tracking-widest text-outline">Load more channels</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

import React from 'react';
import { View, SafeAreaView } from 'react-native';
import { DiscordSidebar } from '../../components/layout/DiscordDrawer';

export default function WorkspacesScreen() {
  return (
    <SafeAreaView className="flex-1 bg-discord-tertiary">
      <View className="flex-1">
        <DiscordSidebar />
      </View>
    </SafeAreaView>
  );
}

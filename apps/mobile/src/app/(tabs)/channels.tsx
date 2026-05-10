import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function ChannelsRedirect() {
  const { workspaceId } = useLocalSearchParams<{ workspaceId: string }>();

  if (workspaceId) {
    return <Redirect href="/(tabs)/workspaces" />;
  }

  return <Redirect href="/(tabs)/workspaces" />;
}

import { Redirect } from 'expo-router';
import { useSession } from '../lib/auth';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { data: session, isPending } = (useSession as any)();

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#2a3439" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/(tabs)/workspaces" />;
}

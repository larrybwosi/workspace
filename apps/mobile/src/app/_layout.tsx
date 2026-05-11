import { useRouter } from "expo-router";
import { Stack } from "expo-router";
import { useFonts, Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
<<<<<<< HEAD
import { useColorScheme } from 'react-native';
=======
import { useColorScheme, View } from 'react-native';
>>>>>>> 2162c4e4c246182311b63e68f6998e8baad44cc6
import "../global.css";
import "../lib/auth";
import { setupNotifications, handleNotificationResponse } from '../lib/notifications';
import * as Notifications from 'expo-notifications';
import { useCallSignaling } from '../hooks/use-call-signaling';
import { IncomingCallOverlay } from '../components/calls/IncomingCallOverlay';
import { MinimizedCallOverlay } from '../components/calls/MinimizedCallOverlay';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
    },
  },
});

function AppContent() {
  const router = useRouter();
  useCallSignaling();

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      handleNotificationResponse(response, router);
    });

    return () => subscription.remove();
  }, [router]);

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="call/[id]" options={{ presentation: 'fullScreenModal' }} />
      </Stack>
      <IncomingCallOverlay />
      <MinimizedCallOverlay />
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  useEffect(() => {
    setupNotifications();
  }, []);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} className={colorScheme === 'dark' ? 'dark' : ''}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

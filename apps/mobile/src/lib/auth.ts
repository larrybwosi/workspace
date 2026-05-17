import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { apiClient } from '@repo/api-client';
import { getBaseURL } from './env';

const getBetterAuthBaseURL = () => {
  const url = getBaseURL();
  if (url.includes('/api/auth')) {
    return url;
  }
  return url + '/api/auth';
};

export const authClient = createAuthClient({
  baseURL: getBetterAuthBaseURL(),
  plugins: [
    ...(Platform.OS !== 'web'
      ? [
          expoClient({
            storage: SecureStore,
          }),
        ]
      : []),
  ],
});

// Add interceptor to sync auth with apiClient
apiClient.interceptors.request.use(async config => {
  const session = await authClient.getSession();
  if (session?.data?.session?.token) {
    config.headers.Authorization = `Bearer ${session.data.session.token}`;
  }
  return config;
});

export const { signUp, useSession, signOut } = authClient;

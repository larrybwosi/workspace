import { createAuthClient } from "better-auth/client";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export const authClient = createAuthClient({
    baseURL: (process.env as any).EXPO_PUBLIC_API_URL || "http://localhost:3000",
    plugins: [
        ...(Platform.OS !== 'web' ? [expoClient({
            storage: SecureStore,
        })] : [])
    ]
});

import { apiClient } from "@repo/api-client";

// Add interceptor to sync auth with apiClient
apiClient.interceptors.request.use(async (config) => {
    const session = await authClient.getSession();
    if (session?.data?.session?.token) {
        config.headers.Authorization = `Bearer ${session.data.session.token}`;
    }
    return config;
});

export const { signIn, signUp, useSession, signOut } = authClient;

import { createAuthClient } from "better-auth/client";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";

export const authClient = createAuthClient({
    baseURL: (process.env as any).EXPO_PUBLIC_API_URL || "http://localhost:3000",
    plugins: [
        expoClient({
            storage: SecureStore,
        })
    ]
});

import { apiClient } from "@repo/api-client";

(authClient.$store as any).listen((event: any) => {
    if (event.type === "setSession") {
        const session = (event as any).data;
        if (session) {
            // In a real mobile app, you might want to use SecureStore or similar
            // Better Auth expo plugin handles the storage, but we need to tell axios about it
            // if we are not using the session cookie (which might be the case in some mobile environments)
        }
    }
});

// Add interceptor to sync auth with apiClient
apiClient.interceptors.request.use(async (config) => {
    const session = await authClient.getSession();
    if (session?.data?.session?.token) {
        config.headers.Authorization = `Bearer ${session.data.session.token}`;
    }
    return config;
});

export const { signIn, signUp, useSession, signOut } = authClient;

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

export const { signIn, signUp, useSession, signOut } = authClient;

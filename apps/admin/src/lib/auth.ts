import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  // baseURL: import.meta.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  baseURL: 'http://localhost:3000',
});

export const { signIn, signOut, signUp, useSession } = authClient;

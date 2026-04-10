'use client';

import { createAuthClient } from 'better-auth/react';
import { validateEnv } from '@repo/shared';

const env = validateEnv();

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_APP_URL,
  // plugins: [jwtClient()],
});

export const { signIn, signOut, signUp, useSession } = authClient;

'use client';

import { createAuthClient } from 'better-auth/react';

const baseURL = typeof window !== 'undefined' && (window as any).__TAURI__
  ? (import.meta as any).env?.VITE_API_URL || (process as any).env?.VITE_API_URL || 'http://localhost:3001'
  : (process as any).env?.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

export const authClient: any = createAuthClient({
  baseURL,
  // plugins: [jwtClient()],
});

export const { signIn, signOut, signUp, useSession } = authClient;

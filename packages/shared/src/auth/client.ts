'use client';

import { createAuthClient } from 'better-auth/react';

const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__;

// Helper to safely access env variables across Vite and Next.js
const getEnv = (name: string) => {
  if (typeof window !== 'undefined') {
    // @ts-ignore
    return (typeof import.meta !== 'undefined' && (import.meta as any).env?.[name]) || (window as any).process?.env?.[name];
  }
  return process.env[name];
};

const baseURL = isTauri
  ? getEnv('VITE_API_URL') || 'http://localhost:3001'
  : getEnv('NEXT_PUBLIC_APP_URL') || 'http://localhost:3001';

export const authClient: any = createAuthClient({
  baseURL,
  // plugins: [jwtClient()],
});

export const { signIn, signOut, signUp, useSession } = authClient;

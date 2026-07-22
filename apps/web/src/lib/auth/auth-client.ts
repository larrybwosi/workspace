'use client';

import { createAuthClient } from 'better-auth/react';

// Helper to safely access env variables across Vite, Next.js and React Native
const getEnv = (name: string) => {
  const g = globalThis as any;

  // Try various common locations for env variables
  // Avoid explicit import.meta to prevent TS1470
  const env = g.process?.env || g.import?.meta?.env || g.__env__;

  if (!env) return undefined;

  return (
    env[name] || env[`VITE_${name}`] || env[`NEXT_PUBLIC_${name}`] || env[`EXPO_PUBLIC_${name}`] || env[`TAURI_${name}`]
  );
};

const getBaseURL = () => {
  // Prefer local auth routes (port 3001) for the web app
  const url =
    getEnv('BETTER_AUTH_URL') ||
    getEnv('NEXT_PUBLIC_APP_URL') ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');

  if (url.includes('/api/auth')) {
    return url;
  }
  return url.replace(/\/$/, '') + '/api/auth';
};

export const authClient: any = createAuthClient({
  baseURL: getBaseURL(),
  fetchOptions: {
    onResponse: async ({ response }) => {
      const res = response as any;
      if (response.ok && res._data) {
        const data = res._data;
        if (data && data.session && data.session.token) {
          localStorage.setItem('better-auth.session_token', data.session.token);
          localStorage.setItem('better-auth.session-token', data.session.token);
        }
      }
    },
  },
});

export const { signIn, signUp } = authClient;

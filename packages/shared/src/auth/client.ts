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
  let url = '';

  // Check localStorage for a custom API URL (used for self-hosted options in desktop app)
  if (typeof window !== 'undefined') {
    const customUrl = window.localStorage.getItem('CUSTOM_API_URL');
    if (customUrl) {
      url = customUrl;
    }
  }

  if (!url) {
    url =
      getEnv('API_URL') ||
      getEnv('NEXT_PUBLIC_API_URL') ||
      getEnv('VITE_API_URL') ||
      getEnv('EXPO_PUBLIC_API_URL') ||
      'http://localhost:3000';
  }

  if (url.includes('/api/auth')) {
    return url;
  }
  return url.replace(/\/$/, '') + '/api/auth';
};

export const setCustomApiUrl = (url: string) => {
  if (typeof window !== 'undefined') {
    if (url) {
      window.localStorage.setItem('CUSTOM_API_URL', url);
    } else {
      window.localStorage.removeItem('CUSTOM_API_URL');
    }
  }
};

export const getCustomApiUrl = () => {
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem('CUSTOM_API_URL');
  }
  return null;
};

export const authClient: any = createAuthClient({
  baseURL: getBaseURL(),
  fetchOptions: {
    onRequest: async (context: any) => {
      if (typeof window !== 'undefined') {
        const token =
          window.localStorage.getItem('better-auth.session-token') ||
          window.localStorage.getItem('better-auth.session_token');
        if (token) {
          context.headers = {
            ...context.headers,
            Authorization: `Bearer ${token}`,
          };
        }
      }
      return context;
    },
  },
});

export const { signIn, signOut, signUp, useSession } = authClient;

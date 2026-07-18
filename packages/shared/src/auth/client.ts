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
    const isProd =
      (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') ||
      getEnv('NODE_ENV') === 'production' ||
      (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1');
    url =
      getEnv('API_URL') ||
      getEnv('NEXT_PUBLIC_API_URL') ||
      getEnv('VITE_API_URL') ||
      getEnv('EXPO_PUBLIC_API_URL') ||
      (isProd ? 'https://api.chat.scryme.tech' : 'http://localhost:3000');
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
    onSuccess: async (context: any) => {
      if (typeof window !== 'undefined') {
        const token = context.response.headers.get('set-auth-token');
        if (token) {
          window.localStorage.setItem('better-auth.session-token', token);
        }
        // If it's a sign-out request, clear the stored tokens
        if (context.request.url.includes('/sign-out')) {
          window.localStorage.removeItem('better-auth.session-token');
          window.localStorage.removeItem('better-auth.session_token');
        }
      }
      return context;
    },
  },
});

export const { signIn, signOut, signUp, useSession } = authClient;

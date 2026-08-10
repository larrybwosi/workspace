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
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const port = window.location.port;
      // If we are running in the browser within the Next.js web app, we should use window.location.origin
      if (port === '3001' || (hostname.includes('scryme.tech') && !hostname.startsWith('api.'))) {
        url = window.location.origin;
      }
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
    auth: {
      type: 'Bearer',
      token: () => {
        if (typeof window !== 'undefined') {
          return (
            localStorage.getItem('bearer_token') ||
            localStorage.getItem('better-auth.session_token') ||
            localStorage.getItem('better-auth.session-token') ||
            ''
          );
        }
        return '';
      },
    },
    onRequest: async (context: any) => {
      if (typeof window !== 'undefined') {
        const reqVal = context.request;
        const urlObj = typeof reqVal === 'string' ? reqVal : reqVal?.url;
        const urlStr = urlObj ? String(urlObj) : '';
        if (urlStr && urlStr.includes('/sign-out')) {
          window.localStorage.removeItem('better-auth.session-token');
          window.localStorage.removeItem('better-auth.session_token');
          window.localStorage.removeItem('bearer_token');
        }
      }
      return context;
    },
    onSuccess: async (context: any) => {
      if (typeof window !== 'undefined') {
        const token = context.response?.headers?.get('set-auth-token');
        if (token) {
          window.localStorage.setItem('better-auth.session-token', token);
          window.localStorage.setItem('better-auth.session_token', token);
          window.localStorage.setItem('bearer_token', token);
        }
        // If it's a sign-out request, clear the stored tokens
        const reqVal = context.request;
        const urlObj = typeof reqVal === 'string' ? reqVal : reqVal?.url;
        const urlStr = urlObj ? String(urlObj) : '';
        if (urlStr && urlStr.includes('/sign-out')) {
          window.localStorage.removeItem('better-auth.session-token');
          window.localStorage.removeItem('better-auth.session_token');
          window.localStorage.removeItem('bearer_token');
        }
      }
      return context;
    },
    onResponse: async ({ response }) => {
      if (typeof window !== 'undefined') {
        const res = response as any;
        if (response && response.ok && res._data) {
          const data = res._data;
          if (data && data.session && data.session.token) {
            localStorage.setItem('better-auth.session_token', data.session.token);
            localStorage.setItem('better-auth.session-token', data.session.token);
            localStorage.setItem('bearer_token', data.session.token);
          }
        }
      }
    },
  },
});

export const { signIn, signOut, signUp, useSession } = authClient;

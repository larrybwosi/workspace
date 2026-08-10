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
        const urlStr = typeof context.request === 'string' ? context.request : context.request?.url || '';
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
        const urlStr = typeof context.request === 'string' ? context.request : context.request?.url || '';
        if (urlStr && urlStr.includes('/sign-out')) {
          window.localStorage.removeItem('better-auth.session-token');
          window.localStorage.removeItem('better-auth.session_token');
          window.localStorage.removeItem('bearer_token');
        }
      }
      return context;
    },
    onResponse: async (context: any) => {
      if (typeof window !== 'undefined') {
        const res = context.response as any;
        if (context.response.ok && res._data) {
          const data = res._data;
          if (data && data.session && data.session.token) {
            localStorage.setItem('better-auth.session_token', data.session.token);
            localStorage.setItem('better-auth.session-token', data.session.token);
            localStorage.setItem('bearer_token', data.session.token);
          }
        }
      }
      return context;
    },
  },
});

export const { signIn, signUp } = authClient;

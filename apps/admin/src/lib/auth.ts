import { createAuthClient } from 'better-auth/react';

// Helper to safely access env variables across Vite, Next.js and React Native
const getEnv = (name: string) => {
  const g = globalThis as any;
  const env = g.process?.env || g.import?.meta?.env || g.__env__;
  if (!env) return undefined;
  return (
    env[name] || env[`VITE_${name}`] || env[`NEXT_PUBLIC_${name}`] || env[`EXPO_PUBLIC_${name}`] || env[`TAURI_${name}`]
  );
};

const getBaseURL = () => {
  const isProd =
    (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') ||
    getEnv('NODE_ENV') === 'production' ||
    (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1');
  const url =
    getEnv('API_URL') ||
    getEnv('NEXT_PUBLIC_API_URL') ||
    getEnv('VITE_API_URL') ||
    getEnv('EXPO_PUBLIC_API_URL') ||
    (isProd ? 'https://api.chat.scryme.tech' : 'http://localhost:3000');
  if (url.includes('/api/auth')) {
    return url;
  }
  return url.replace(/\/$/, '') + '/api/auth';
};

const authClient = createAuthClient({
  baseURL: getBaseURL(),
});

const client = authClient as any;
export const signIn = client.signIn;
export const useSession = client.useSession;

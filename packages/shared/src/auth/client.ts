'use client';

import { createAuthClient } from 'better-auth/react';

// Helper to safely access env variables across Vite and Next.js
const getEnv = (name: string) => {
  if (typeof window !== 'undefined') {
    try {
      // @ts-ignore
      const metaEnv = import.meta.env;
      if (metaEnv) {
        const viteVal = metaEnv[name] || metaEnv[`VITE_${name}`];
        if (viteVal) return viteVal;
      }
    } catch (e) {
      // Ignore errors in environments that don't support import.meta
    }

    // Next.js and others might use window.process.env
    return (window as any).process?.env?.[name];
  }
  return process.env[name];
};

const getBaseURL = () => {
  const url = getEnv('NEXT_PUBLIC_API_URL') || getEnv('VITE_API_URL') || 'http://localhost:3000';
  if (url.includes('/api/auth')) {
    return url;
  }
  return url.replace(/\/$/, '') + '/api/auth';
};

export const authClient: any = createAuthClient({
  baseURL: getBaseURL(),
});

export const { signIn, signOut, signUp, useSession } = authClient;

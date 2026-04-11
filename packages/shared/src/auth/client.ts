'use client';

import { createAuthClient } from 'better-auth/react';

// Helper to safely access env variables across Vite and Next.js
const getEnv = (name: string) => {
  if (typeof window !== 'undefined') {
    // Vite uses import.meta.env
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      const viteVal = (import.meta as any).env[name];
      if (viteVal) return viteVal;
      // Also check VITE_ prefix for Vite apps
      const vitePrefixVal = (import.meta as any).env[`VITE_${name}`];
      if (vitePrefixVal) return vitePrefixVal;
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

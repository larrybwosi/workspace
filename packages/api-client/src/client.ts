import axios from 'axios';

// Helper to safely access env variables across Vite, Next.js and React Native
const getEnv = (name: string) => {
  const g = globalThis as typeof globalThis & { process?: { env?: Record<string, string> }; import?: { meta?: { env?: Record<string, string> } }; __env__?: Record<string, string>; };

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
  if (typeof window !== 'undefined') {
    const customUrl = window.localStorage.getItem('CUSTOM_API_URL');
    if (customUrl) {
      url = customUrl;
    }
  }
  if (!url) {
    const isProd = getEnv('NODE_ENV') === 'production';
    url = getEnv('API_URL') || (isProd ? 'https://api.chat.scryme.tech' : 'http://localhost:3000');
  }
  return url.replace(/\/$/, '') + '/api';
};

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  withCredentials: true,
});

apiClient.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const token =
      window.localStorage.getItem('better-auth.session-token') ||
      window.localStorage.getItem('better-auth.session_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

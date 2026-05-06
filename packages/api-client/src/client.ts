import axios from 'axios';

const getBaseURL = () => {
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return `${process.env.NEXT_PUBLIC_API_URL}/api`;
    }
    if ((process.env as Record<string, string | undefined>).EXPO_PUBLIC_API_URL) {
      return `${(process.env as Record<string, string | undefined>).EXPO_PUBLIC_API_URL}/api`;
    }
  }

  const global = globalThis as Record<string, unknown>;
  if (
    global.import &&
    (global.import as Record<string, unknown>).meta &&
    ((global.import as Record<string, unknown>).meta as Record<string, unknown>).env
  ) {
    const env = ((global.import as Record<string, unknown>).meta as Record<string, unknown>).env as Record<string, string | undefined>;
    if (env.NEXT_PUBLIC_API_URL) {
      return `${env.NEXT_PUBLIC_API_URL}/api`;
    }
    if (env.EXPO_PUBLIC_API_URL) {
      return `${env.EXPO_PUBLIC_API_URL}/api`;
    }
  }

  // Check for Next.js public env specifically if not in process.env yet (sometimes during build)
  const globalProcess = global.process as Record<string, any> | undefined;
  if (globalProcess && globalProcess.env) {
    const env = globalProcess.env as Record<string, string | undefined>;
    if (env.NEXT_PUBLIC_API_URL) {
      return `${env.NEXT_PUBLIC_API_URL}/api`;
    }
    if (env.EXPO_PUBLIC_API_URL) {
      return `${env.EXPO_PUBLIC_API_URL}/api`;
    }
  }

  return 'http://localhost:3000/api';
};

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  withCredentials: true,
});

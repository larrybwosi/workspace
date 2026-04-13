import axios from 'axios';

const getBaseURL = () => {
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return `${process.env.NEXT_PUBLIC_API_URL}/api`;
    }
    if ((process.env as any).EXPO_PUBLIC_API_URL) {
      return `${(process.env as any).EXPO_PUBLIC_API_URL}/api`;
    }
  }

  const global = globalThis as any;
  if (global.import && global.import.meta && global.import.meta.env) {
    if (global.import.meta.env.NEXT_PUBLIC_API_URL) {
      return `${global.import.meta.env.NEXT_PUBLIC_API_URL}/api`;
    }
    if (global.import.meta.env.EXPO_PUBLIC_API_URL) {
      return `${global.import.meta.env.EXPO_PUBLIC_API_URL}/api`;
    }
  }

  // Check for Next.js public env specifically if not in process.env yet (sometimes during build)
  if (global.process && global.process.env) {
    if (global.process.env.NEXT_PUBLIC_API_URL) {
      return `${global.process.env.NEXT_PUBLIC_API_URL}/api`;
    }
    if (global.process.env.EXPO_PUBLIC_API_URL) {
      return `${global.process.env.EXPO_PUBLIC_API_URL}/api`;
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

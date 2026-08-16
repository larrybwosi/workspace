import axios, { AxiosRequestConfig, AxiosError } from 'axios';

// Helper to safely access env variables across Vite, Next.js and React Native
const getEnv = (name: string) => {
  const g = globalThis as typeof globalThis & {
    process?: { env?: Record<string, string> };
    import?: { meta?: { env?: Record<string, string> } };
    __env__?: Record<string, string>;
  };

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
    const isProd =
      (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') ||
      getEnv('NODE_ENV') === 'production' ||
      (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1');
    url = getEnv('API_URL') || getEnv('NEXT_PUBLIC_API_URL') || (isProd ? 'https://api.chat.scryme.tech' : 'http://localhost:3000');
  }
  url = url.replace(/\/$/, '');
  if (url.endsWith('/api')) {
    url = url.slice(0, -4);
  }
  return url;
};

let globalToken: string | null = null;

export const setGlobalToken = (token: string | null) => {
  globalToken = token;
};

export const getGlobalToken = () => globalToken;

export const AXIOS_INSTANCE = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  withCredentials: true,
});

AXIOS_INSTANCE.interceptors.request.use(config => {
  if (!config.headers) {
    config.headers = {} as any;
  }

  // Check if an Authorization header is already present (case-insensitive)
  const hasAuth =
    config.headers.Authorization ||
    config.headers.authorization ||
    (config.headers as any)['Authorization'] ||
    (config.headers as any)['authorization'];

  // 1. Apply global token if available and no Auth header is set yet
  if (globalToken && !hasAuth) {
    config.headers.Authorization = `Bearer ${globalToken}`;
  }

  // 2. Check for browser-based session/bearer tokens
  if (typeof window !== 'undefined') {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
      return null;
    };

    let token =
      window.localStorage.getItem('better-auth.session-token') ||
      window.localStorage.getItem('better-auth.session_token') ||
      window.localStorage.getItem('bearer_token');

    if (!token) {
      token =
        getCookie('better-auth.session_token') ||
        getCookie('better-auth.session-token') ||
        getCookie('bearer_token');
      if (token) {
        window.localStorage.setItem('better-auth.session_token', token);
        window.localStorage.setItem('better-auth.session-token', token);
        window.localStorage.setItem('bearer_token', token);
      }
    } else {
      // Keep everything in sync
      if (!window.localStorage.getItem('bearer_token')) {
        window.localStorage.setItem('bearer_token', token);
      }
      if (!window.localStorage.getItem('better-auth.session_token')) {
        window.localStorage.setItem('better-auth.session_token', token);
      }
      if (!window.localStorage.getItem('better-auth.session-token')) {
        window.localStorage.setItem('better-auth.session-token', token);
      }
    }

    // Re-check for Authorization header before applying browser token
    const hasAuthNow =
      config.headers.Authorization ||
      config.headers.authorization ||
      (config.headers as any)['Authorization'] ||
      (config.headers as any)['authorization'];

    if (token && !hasAuthNow) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  const source = axios.CancelToken.source();

  // Merge headers carefully so that options.headers does not overwrite config.headers completely
  const mergedHeaders = {
    ...config.headers,
    ...options?.headers,
  };

  const promise = AXIOS_INSTANCE({
    ...config,
    ...options,
    headers: mergedHeaders,
    cancelToken: source.token,
  }).then(({ data }) => data);

  // @ts-ignore
  promise.cancel = () => {
    source.cancel('Query was cancelled by React Query');
  };

  return promise;
};

export type ErrorType<Error> = AxiosError<Error>;
export type BodyType<Body> = Body;

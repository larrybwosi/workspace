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

/**
 * Custom SDK Error class for meaningful, developer-friendly error messages and structured error details.
 */
export class ScrymeSDKError extends Error {
  public readonly status?: number;
  public readonly code?: string;
  public readonly data?: any;
  public readonly rawError?: any;

  constructor(
    message: string,
    options?: {
      status?: number;
      code?: string;
      data?: any;
      rawError?: any;
    }
  ) {
    super(message);
    this.name = 'ScrymeSDKError';
    this.status = options?.status;
    this.code = options?.code;
    this.data = options?.data;
    this.rawError = options?.rawError;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export { ScrymeSDKError as ScrymeError };

/**
 * Parses any error (AxiosError, Error, or unknown object) into a clean, meaningful ScrymeSDKError.
 */
export function parseSDKError(error: any): ScrymeSDKError {
  if (error instanceof ScrymeSDKError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const response = error.response;
    const status = response?.status;
    const responseData = response?.data;
    const code = error.code || (responseData && typeof responseData === 'object' ? responseData.code : undefined);

    let message: string | undefined;

    if (responseData) {
      if (typeof responseData === 'string' && responseData.trim()) {
        message = responseData;
      } else if (typeof responseData === 'object' && responseData !== null) {
        if (Array.isArray(responseData.message)) {
          message = responseData.message.filter(Boolean).join('; ');
        } else if (typeof responseData.message === 'string' && responseData.message.trim()) {
          message = responseData.message;
        } else if (typeof responseData.error === 'string' && responseData.error.trim()) {
          message = responseData.error;
        } else if (responseData.error && typeof responseData.error === 'object' && typeof responseData.error.message === 'string') {
          message = responseData.error.message;
        } else if (typeof responseData.detail === 'string' && responseData.detail.trim()) {
          message = responseData.detail;
        }
      }
    }

    if (!message) {
      if (response?.statusText) {
        message = `HTTP ${status}: ${response.statusText}`;
      } else if (error.message && !error.message.startsWith('Request failed with status code')) {
        message = error.message;
      } else if (status) {
        message = `Request failed with status code ${status}`;
      } else if (error.message) {
        message = error.message;
      } else {
        message = 'An unexpected error occurred during API request';
      }
    }

    return new ScrymeSDKError(message, {
      status,
      code,
      data: responseData,
      rawError: error,
    });
  }

  if (error instanceof Error) {
    return new ScrymeSDKError(error.message, {
      rawError: error,
    });
  }

  return new ScrymeSDKError(typeof error === 'string' ? error : 'An unexpected error occurred', {
    rawError: error,
  });
}

export const AXIOS_INSTANCE = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  withCredentials: true,
});

AXIOS_INSTANCE.interceptors.response.use(
  response => response,
  error => Promise.reject(parseSDKError(error))
);

AXIOS_INSTANCE.interceptors.request.use(config => {
  if (!config.baseURL) {
    config.baseURL = getBaseURL();
  }

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
  })
    .then(({ data }) => data)
    .catch(error => {
      throw parseSDKError(error);
    });

  // @ts-ignore
  promise.cancel = () => {
    source.cancel('Query was cancelled by React Query');
  };

  return promise;
};

export type ErrorType<Error> = ScrymeSDKError;
export type BodyType<Body> = Body;

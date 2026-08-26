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

const isTauri = () => {
  return (
    typeof window !== 'undefined' &&
    ('__TAURI__' in window || '__TAURI_INTERNALS__' in window)
  );
};

export const customFetch: typeof fetch = async (
  url: string | URL | Request,
  init?: RequestInit
): Promise<Response> => {
  if (!isTauri()) {
    return fetch(url, init);
  }

  try {
    const { invoke } = await import('@tauri-apps/api/core');

    let fullUrl = '';
    if (typeof url === 'string') {
      fullUrl = url;
    } else if (url instanceof URL) {
      fullUrl = url.toString();
    } else if (url && typeof url === 'object' && 'url' in url) {
      fullUrl = (url as Request).url;
    }

    let method = init?.method;
    if (!method && url && typeof url === 'object' && 'method' in url) {
      method = (url as Request).method;
    }
    method = (method || 'GET').toUpperCase();

    let path = fullUrl;
    let baseUrlOverride: string | undefined = undefined;
    if (fullUrl.startsWith('http://') || fullUrl.startsWith('https://')) {
      const urlObj = new URL(fullUrl);
      baseUrlOverride = urlObj.origin;
      path = urlObj.pathname + urlObj.search;
    }

    const headersObj: Record<string, string> = {};
    const initHeaders =
      init?.headers ||
      (url && typeof url === 'object' && 'headers' in url ? (url as Request).headers : undefined);

    if (initHeaders) {
      if (typeof (initHeaders as any).forEach === 'function') {
        (initHeaders as any).forEach((value: string, key: string) => {
          headersObj[key] = value;
        });
      } else if (Array.isArray(initHeaders)) {
        for (const [k, v] of initHeaders) {
          if (k && v !== undefined && v !== null) {
            headersObj[k] = String(v);
          }
        }
      } else if (typeof initHeaders === 'object') {
        for (const [k, v] of Object.entries(initHeaders)) {
          if (v !== undefined && v !== null) {
            headersObj[k] = String(v);
          }
        }
      }
    }

    let body: any = init?.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        // Keep as string if not JSON
      }
    }

    const res: any = await invoke('api_request', {
      request: {
        method,
        path,
        headers: headersObj,
        body,
        baseUrl: baseUrlOverride || getBaseURL(),
      },
    });

    const responseHeaders = new Headers();
    if (res.headers) {
      for (const [k, v] of Object.entries(res.headers)) {
        if (typeof v === 'string') {
          responseHeaders.append(k, v);
        }
      }
    }

    const responseBody = typeof res.body === 'string' ? res.body : JSON.stringify(res.body ?? '');

    return new Response(responseBody, {
      status: res.status || 200,
      statusText: String(res.status || 200),
      headers: responseHeaders,
    });
  } catch (err) {
    console.error('Tauri fetch error, falling back to window.fetch:', err);
    return fetch(url, init);
  }
};

export const authClient: any = createAuthClient({
  baseURL: getBaseURL(),
  fetchOptions: {
    customFetchImpl: customFetch,
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

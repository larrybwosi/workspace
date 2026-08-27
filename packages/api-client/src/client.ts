import axios from 'axios';

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
    env[name] || env[`VITE_${name}`] || env[`NEXT_PUBLIC_${name}`] || env[`TAURI_${name}`]
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
    url = getEnv('API_URL') || getEnv('NEXT_PUBLIC_API_URL') || (isProd ? 'https://api.chat.scryme.tech' : 'http://localhost:3000');
  }
  return url.replace(/\/$/, '') + '/api';
};

const isTauri = () => {
  return (
    typeof window !== 'undefined' &&
    ('__TAURI__' in window || '__TAURI_INTERNALS__' in window)
  );
};

const tauriAdapter = async (config: any) => {
  const { invoke } = await import('@tauri-apps/api/core');

  let fullUrl = config.url || '';
  if (config.baseURL && !fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
    const base = config.baseURL.replace(/\/$/, '');
    const path = fullUrl.startsWith('/') ? fullUrl : `/${fullUrl}`;
    fullUrl = `${base}${path}`;
  }

  let path = fullUrl;
  let baseUrlOverride: string | undefined = undefined;
  if (fullUrl.startsWith('http://') || fullUrl.startsWith('https://')) {
    const urlObj = new URL(fullUrl);
    baseUrlOverride = urlObj.origin;
    path = urlObj.pathname + urlObj.search;
  }

  if (config.params && Object.keys(config.params).length > 0) {
    const searchParams = new URLSearchParams();
    for (const [k, v] of Object.entries(config.params)) {
      if (v !== undefined && v !== null) {
        searchParams.append(k, String(v));
      }
    }
    const sep = path.includes('?') ? '&' : '?';
    path = `${path}${sep}${searchParams.toString()}`;
  }

  let body = config.data;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      // Keep as string if not JSON
    }
  }

  const headers: Record<string, string> = {};
  if (config.headers) {
    const headerObj = typeof config.headers.toJSON === 'function' ? config.headers.toJSON() : config.headers;
    for (const [k, v] of Object.entries(headerObj)) {
      if (v !== undefined && v !== null && typeof v !== 'function') {
        headers[k] = String(v);
      }
    }
  }

  const res: any = await invoke('api_request', {
    request: {
      method: (config.method || 'get').toUpperCase(),
      path,
      headers,
      body,
      baseUrl: baseUrlOverride || getBaseURL(),
    },
  });

  return {
    data: res.body,
    status: res.status,
    statusText: String(res.status),
    headers: res.headers || {},
    config,
    request: {},
  };
};

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  withCredentials: true,
  adapter: isTauri() ? tauriAdapter : undefined,
});

apiClient.interceptors.request.use(config => {
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

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

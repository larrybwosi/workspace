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
 * HTTP Error class representing a non-2xx fetch response.
 */
export class HttpError extends Error {
  public readonly status: number;
  public readonly statusText: string;
  public readonly data: any;
  public readonly headers: Headers;
  public readonly code?: string;

  constructor(status: number, statusText: string, data: any, headers: Headers) {
    super(`Request failed with status code ${status}`);
    this.name = 'HttpError';
    this.status = status;
    this.statusText = statusText;
    this.data = data;
    this.headers = headers;
    this.code = data && typeof data === 'object' && data.code ? String(data.code) : undefined;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Parses any error (HttpError, Error, or unknown object) into a clean, meaningful ScrymeSDKError.
 */
export function parseSDKError(error: any): ScrymeSDKError {
  if (error instanceof ScrymeSDKError) {
    return error;
  }

  // Handle HttpError or Axios-compatible error structure
  const response = error?.response;
  const status = error?.status ?? response?.status;
  const statusText = error?.statusText ?? response?.statusText;
  const responseData = error?.data ?? response?.data;
  const code = error?.code || (responseData && typeof responseData === 'object' ? responseData.code : undefined);

  if (status !== undefined || responseData !== undefined) {
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
      if (statusText) {
        message = `HTTP ${status}: ${statusText}`;
      } else if (error?.message && !error.message.startsWith('Request failed with status code')) {
        message = error.message;
      } else if (status) {
        message = `Request failed with status code ${status}`;
      } else if (error?.message) {
        message = error.message;
      } else {
        message = 'An unexpected error occurred during API request';
      }
    }

    return new ScrymeSDKError(message || 'An unexpected error occurred during API request', {
      status,
      code,
      data: responseData,
      rawError: error,
    });
  }

  if (error instanceof Error) {
    // Check for AbortError / TimeoutError
    const isTimeout =
      error.name === 'TimeoutError' ||
      error.name === 'AbortError' ||
      (typeof error.message === 'string' && error.message.toLowerCase().includes('timeout'));

    return new ScrymeSDKError(error.message, {
      code: isTimeout ? (error.name === 'TimeoutError' ? 'ECONNABORTED' : error.name) : (error as any).code,
      rawError: error,
    });
  }

  return new ScrymeSDKError(typeof error === 'string' ? error : 'An unexpected error occurred', {
    rawError: error,
  });
}

/**
 * Fetch-based request configuration interface, backward compatible with AxiosRequestConfig properties.
 */
export interface CustomRequestConfig {
  url?: string;
  method?: string;
  baseURL?: string;
  headers?: Record<string, string | undefined> | HeadersInit;
  params?: Record<string, unknown> | URLSearchParams;
  data?: unknown;
  body?: unknown;
  timeout?: number;
  signal?: AbortSignal;
  credentials?: RequestCredentials;
  mode?: RequestMode;
  cache?: RequestCache;
  [key: string]: unknown;
}

// Aliases for compatibility
export type RequestConfig = CustomRequestConfig;
export type AxiosRequestConfig = CustomRequestConfig;

/**
 * Resolves browser-stored tokens or cookies if in a browser environment.
 */
const getBrowserToken = (): string | null => {
  if (typeof window === 'undefined') return null;

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

  return token;
};

/**
 * Normalizes headers from various formats into a plain Record<string, string>.
 */
const normalizeHeaders = (headers?: Record<string, unknown> | HeadersInit): Record<string, string> => {
  const result: Record<string, string> = {};
  if (!headers) return result;

  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      result[key] = value;
    });
  } else if (Array.isArray(headers)) {
    headers.forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        result[key] = String(value);
      }
    });
  } else if (typeof headers === 'object') {
    for (const [key, value] of Object.entries(headers)) {
      if (value !== undefined && value !== null) {
        result[key] = String(value);
      }
    }
  }

  return result;
};

/**
 * Builds the complete URL with baseURL and query parameters applied.
 */
const buildFullUrl = (
  rawUrl: string,
  baseURL?: string,
  params?: Record<string, unknown> | URLSearchParams
): string => {
  let url = rawUrl || '';

  // Prepend base URL if rawUrl is relative
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    const base = (baseURL !== undefined ? baseURL : getBaseURL()).replace(/\/$/, '');
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    url = `${base}${cleanPath}`;
  }

  // Append query parameters
  if (params) {
    let queryString = '';
    if (params instanceof URLSearchParams) {
      queryString = params.toString();
    } else if (typeof params === 'object') {
      const sp = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(item => {
              if (item !== undefined && item !== null) {
                sp.append(key, String(item));
              }
            });
          } else {
            sp.append(key, String(value));
          }
        }
      }
      queryString = sp.toString();
    }

    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  return url;
};

/**
 * Cancelable promise type matching Orval / React Query expectation.
 */
export interface CancelablePromise<T> extends Promise<T> {
  cancel: () => void;
}

/**
 * Custom HTTP request instance using native Fetch.
 */
export const customInstance = <T>(
  config: CustomRequestConfig,
  options?: CustomRequestConfig
): CancelablePromise<T> => {
  const mergedConfig: CustomRequestConfig = {
    ...config,
    ...options,
  };

  const baseURL = mergedConfig.baseURL;
  const rawUrl = mergedConfig.url || '';
  const params = mergedConfig.params;
  const fullUrl = buildFullUrl(rawUrl, baseURL, params);

  const headers = {
    ...normalizeHeaders(config.headers),
    ...normalizeHeaders(options?.headers),
  };

  // Check if Authorization header is set (case-insensitive)
  const hasAuth = Object.keys(headers).some(k => k.toLowerCase() === 'authorization');

  // 1. Apply global token if available and no Auth header is set yet
  if (globalToken && !hasAuth) {
    headers['Authorization'] = `Bearer ${globalToken}`;
  }

  // 2. Check for browser-based session/bearer tokens
  if (typeof window !== 'undefined' && !hasAuth && !globalToken) {
    const token = getBrowserToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // Prepare request body
  const rawBody = mergedConfig.data !== undefined ? mergedConfig.data : mergedConfig.body;
  let body: BodyInit | undefined;

  if (rawBody !== undefined && rawBody !== null) {
    const isFormData = typeof FormData !== 'undefined' && rawBody instanceof FormData;
    const isURLSearchParams = typeof URLSearchParams !== 'undefined' && rawBody instanceof URLSearchParams;
    const isBlob = typeof Blob !== 'undefined' && rawBody instanceof Blob;
    const isBuffer = typeof ArrayBuffer !== 'undefined' && (rawBody instanceof ArrayBuffer || ArrayBuffer.isView(rawBody));

    if (isFormData) {
      body = rawBody as FormData;
      // Let the browser set Content-Type with boundary for multipart/form-data
      Object.keys(headers).forEach(k => {
        if (k.toLowerCase() === 'content-type' && headers[k].includes('multipart/form-data')) {
          delete headers[k];
        }
      });
    } else if (isURLSearchParams || isBlob || isBuffer || typeof rawBody === 'string') {
      body = rawBody as BodyInit;
    } else {
      body = JSON.stringify(rawBody);
      const hasContentType = Object.keys(headers).some(k => k.toLowerCase() === 'content-type');
      if (!hasContentType) {
        headers['Content-Type'] = 'application/json';
      }
    }
  }

  // AbortController for timeout and query cancellation
  const abortController = new AbortController();
  const timeoutMs = typeof mergedConfig.timeout === 'number' ? mergedConfig.timeout : 10000;

  // Listen to external signal if provided
  const externalSignal = mergedConfig.signal;
  if (externalSignal) {
    if (externalSignal.aborted) {
      abortController.abort(externalSignal.reason);
    } else {
      externalSignal.addEventListener('abort', () => abortController.abort(externalSignal.reason));
    }
  }

  let timer: any = null;
  if (timeoutMs > 0) {
    timer = setTimeout(() => {
      const timeoutErr = new Error(`timeout of ${timeoutMs}ms exceeded`);
      timeoutErr.name = 'TimeoutError';
      (timeoutErr as any).code = 'ECONNABORTED';
      abortController.abort(timeoutErr);
    }, timeoutMs);
  }

  const method = (mergedConfig.method || 'GET').toUpperCase();
  const credentials = mergedConfig.credentials ?? 'include';

  const executeFetch = async (): Promise<T> => {
    try {
      const response = await fetch(fullUrl, {
        method,
        headers,
        body: ['GET', 'HEAD'].includes(method) ? undefined : body,
        credentials,
        signal: abortController.signal,
      });

      if (timer) clearTimeout(timer);

      // Extract response content
      const contentType = response.headers.get('content-type') || '';
      let data: any;

      if (contentType.includes('application/json')) {
        const text = await response.text();
        data = text ? JSON.parse(text) : undefined;
      } else {
        const text = await response.text();
        data = text || undefined;
      }

      if (!response.ok) {
        throw new HttpError(response.status, response.statusText, data, response.headers);
      }

      return data as T;
    } catch (err: any) {
      if (timer) clearTimeout(timer);
      throw parseSDKError(err);
    }
  };

  const promise = executeFetch() as CancelablePromise<T>;

  promise.cancel = () => {
    const cancelErr = new Error('Query was cancelled by React Query');
    cancelErr.name = 'AbortError';
    abortController.abort(cancelErr);
  };

  return promise;
};

export type ErrorType<Error> = ScrymeSDKError;
export type BodyType<Body> = Body;

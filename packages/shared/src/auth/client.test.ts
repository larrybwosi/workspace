// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';
import { customFetch } from './client';

describe('customFetch for auth client', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    delete (window as any).__TAURI__;
    delete (window as any).__TAURI_INTERNALS__;
  });

  it('delegates to window.fetch when not running in Tauri environment', async () => {
    const mockResponse = new Response(JSON.stringify({ success: true }), { status: 200 });
    const fetchSpy = vi.fn().mockResolvedValue(mockResponse);
    globalThis.fetch = fetchSpy;

    const res = await customFetch('http://localhost:3000/api/auth/sign-in/email', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
      headers: { 'content-type': 'application/json' },
    });

    expect(fetchSpy).toHaveBeenCalledWith('http://localhost:3000/api/auth/sign-in/email', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
      headers: { 'content-type': 'application/json' },
    });
    expect(invoke).not.toHaveBeenCalled();
    expect(res).toBe(mockResponse);
  });

  it('invokes native tauri api_request when running in Tauri environment', async () => {
    (window as any).__TAURI__ = {};
    vi.mocked(invoke).mockResolvedValue({
      status: 200,
      headers: { 'set-auth-token': 'mock-session-token', 'content-type': 'application/json' },
      body: { user: { id: 'user-1', email: 'test@example.com' }, session: { token: 'mock-session-token' } },
    });

    const res = await customFetch('http://localhost:3000/api/auth/sign-in/email', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
      headers: { 'content-type': 'application/json' },
    });

    expect(invoke).toHaveBeenCalledWith('api_request', {
      request: {
        method: 'POST',
        path: '/api/auth/sign-in/email',
        headers: { 'content-type': 'application/json' },
        body: { email: 'test@example.com', password: 'password' },
        baseUrl: 'http://localhost:3000',
      },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('set-auth-token')).toBe('mock-session-token');
    const data = await res.json();
    expect(data.user.email).toBe('test@example.com');
  });

  it('falls back to window.fetch if invoke throws an error in Tauri', async () => {
    (window as any).__TAURI__ = {};
    vi.mocked(invoke).mockRejectedValue(new Error('Tauri command error'));

    const mockResponse = new Response(JSON.stringify({ fallback: true }), { status: 200 });
    const fetchSpy = vi.fn().mockResolvedValue(mockResponse);
    globalThis.fetch = fetchSpy;

    const res = await customFetch('http://localhost:3000/api/auth/sign-in/email', {
      method: 'POST',
    });

    expect(fetchSpy).toHaveBeenCalled();
    expect(res).toBe(mockResponse);
  });
});

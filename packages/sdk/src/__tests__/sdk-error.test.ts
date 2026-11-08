import { describe, it, expect, vi } from 'vitest';
import { ScrymeSDKError, ScrymeError, HttpError, parseSDKError, customInstance } from '../custom-instance';
import { ScrymeSDK } from '../sdk';

describe('ScrymeSDKError & parseSDKError', () => {
  it('should construct ScrymeSDKError with status, code, data, and rawError', () => {
    const rawErr = new Error('Raw');
    const err = new ScrymeSDKError('Something went wrong', {
      status: 400,
      code: 'BAD_REQUEST',
      data: { details: 'Invalid field' },
      rawError: rawErr,
    });

    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ScrymeSDKError);
    expect(err).toBeInstanceOf(ScrymeError);
    expect(err.name).toBe('ScrymeSDKError');
    expect(err.message).toBe('Something went wrong');
    expect(err.status).toBe(400);
    expect(err.code).toBe('BAD_REQUEST');
    expect(err.data).toEqual({ details: 'Invalid field' });
    expect(err.rawError).toBe(rawErr);
  });

  it('should return existing ScrymeSDKError as is', () => {
    const original = new ScrymeSDKError('Already parsed');
    const result = parseSDKError(original);
    expect(result).toBe(original);
  });

  it('should parse NestJS validation error arrays into joined message', () => {
    const httpError = new HttpError(
      400,
      'Bad Request',
      {
        statusCode: 400,
        error: 'Bad Request',
        message: ['email must be an email', 'password is too short'],
      },
      new Headers()
    );

    const parsed = parseSDKError(httpError);
    expect(parsed).toBeInstanceOf(ScrymeSDKError);
    expect(parsed.message).toBe('email must be an email; password is too short');
    expect(parsed.status).toBe(400);
    expect(parsed.data).toEqual({
      statusCode: 400,
      error: 'Bad Request',
      message: ['email must be an email', 'password is too short'],
    });
  });

  it('should parse standard NestJS error response with string message', () => {
    const httpError = new HttpError(
      404,
      'Not Found',
      {
        statusCode: 404,
        error: 'Not Found',
        message: "Workspace 'acme' not found",
      },
      new Headers()
    );

    const parsed = parseSDKError(httpError);
    expect(parsed.message).toBe("Workspace 'acme' not found");
    expect(parsed.status).toBe(404);
  });

  it('should parse error object format { error: "Unauthorized" }', () => {
    const httpError = new HttpError(
      401,
      'Unauthorized',
      {
        error: 'Invalid session token',
      },
      new Headers()
    );

    const parsed = parseSDKError(httpError);
    expect(parsed.message).toBe('Invalid session token');
    expect(parsed.status).toBe(401);
  });

  it('should parse nested error object format { error: { message: "Token expired" } }', () => {
    const httpError = new HttpError(
      401,
      'Unauthorized',
      {
        error: {
          message: 'Token expired',
          code: 'TOKEN_EXPIRED',
        },
      },
      new Headers()
    );

    const parsed = parseSDKError(httpError);
    expect(parsed.message).toBe('Token expired');
    expect(parsed.status).toBe(401);
  });

  it('should parse string response data', () => {
    const httpError = new HttpError(
      502,
      'Bad Gateway',
      'Bad Gateway Error from Upstream',
      new Headers()
    );

    const parsed = parseSDKError(httpError);
    expect(parsed.message).toBe('Bad Gateway Error from Upstream');
    expect(parsed.status).toBe(502);
  });

  it('should handle network errors without response object', () => {
    const fetchError = new TypeError('Failed to fetch');
    const parsed = parseSDKError(fetchError);

    expect(parsed).toBeInstanceOf(ScrymeSDKError);
    expect(parsed.message).toBe('Failed to fetch');
    expect(parsed.status).toBeUndefined();
  });

  it('should handle timeout errors', () => {
    const timeoutError = new Error('timeout of 10000ms exceeded');
    timeoutError.name = 'TimeoutError';
    (timeoutError as any).code = 'ECONNABORTED';

    const parsed = parseSDKError(timeoutError);
    expect(parsed.message).toBe('timeout of 10000ms exceeded');
    expect(parsed.code).toBe('ECONNABORTED');
  });

  it('should handle standard non-Http Error objects', () => {
    const standardError = new Error('Something broke');
    const parsed = parseSDKError(standardError);

    expect(parsed).toBeInstanceOf(ScrymeSDKError);
    expect(parsed.message).toBe('Something broke');
  });

  it('should handle primitive string errors', () => {
    const parsed = parseSDKError('Custom error string');

    expect(parsed).toBeInstanceOf(ScrymeSDKError);
    expect(parsed.message).toBe('Custom error string');
  });

  it('should wrap M2M token fetch error into ScrymeSDKError', async () => {
    const sdk = new ScrymeSDK({
      baseURL: 'https://api.test.com',
      clientId: 'invalid-id',
      clientSecret: 'invalid-secret',
    });

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({ message: 'Invalid M2M client credentials' }),
          {
            status: 401,
            statusText: 'Unauthorized',
            headers: { 'Content-Type': 'application/json' },
          }
        )
      )
    );

    await expect(sdk.getOrFetchToken()).rejects.toThrow(ScrymeSDKError);

    try {
      await sdk.getOrFetchToken();
    } catch (err: any) {
      expect(err).toBeInstanceOf(ScrymeSDKError);
      expect(err.message).toBe('Invalid M2M client credentials');
      expect(err.status).toBe(401);
    }

    globalThis.fetch = originalFetch;
  });

  describe('customInstance fetch features', () => {
    const originalFetch = globalThis.fetch;

    it('should correctly build query parameters', async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );
      globalThis.fetch = mockFetch;

      const res = await customInstance<{ ok: boolean }>({
        url: '/api/test',
        baseURL: 'https://api.example.com',
        params: {
          q: 'search term',
          filter: ['a', 'b'],
          limit: 10,
        },
      });

      expect(res).toEqual({ ok: true });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/api/test?q=search+term&filter=a&filter=b&limit=10',
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
        })
      );

      globalThis.fetch = originalFetch;
    });

    it('should support cancellation via promise.cancel()', async () => {
      let aborted = false;
      const mockFetch = vi.fn().mockImplementation((_url, options) => {
        options?.signal?.addEventListener('abort', () => {
          aborted = true;
        });
        return new Promise((_resolve, reject) => {
          options?.signal?.addEventListener('abort', () => {
            const err = new Error('The operation was aborted');
            err.name = 'AbortError';
            reject(err);
          });
        });
      });
      globalThis.fetch = mockFetch;

      const promise = customInstance({
        url: '/api/long-running',
        baseURL: 'https://api.example.com',
      });

      promise.cancel();

      await expect(promise).rejects.toThrow();
      expect(aborted).toBe(true);

      globalThis.fetch = originalFetch;
    });
  });
});

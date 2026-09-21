import { describe, it, expect, vi } from 'vitest';
import axios, { AxiosError } from 'axios';
import { ScrymeSDKError, ScrymeError, parseSDKError } from '../custom-instance';
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
    const axiosError = new AxiosError(
      'Request failed with status code 400',
      'ERR_BAD_REQUEST',
      undefined,
      {},
      {
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: {} as any,
        data: {
          statusCode: 400,
          error: 'Bad Request',
          message: ['email must be an email', 'password is too short'],
        },
      }
    );

    const parsed = parseSDKError(axiosError);
    expect(parsed).toBeInstanceOf(ScrymeSDKError);
    expect(parsed.message).toBe('email must be an email; password is too short');
    expect(parsed.status).toBe(400);
    expect(parsed.code).toBe('ERR_BAD_REQUEST');
    expect(parsed.data).toEqual({
      statusCode: 400,
      error: 'Bad Request',
      message: ['email must be an email', 'password is too short'],
    });
  });

  it('should parse standard NestJS error response with string message', () => {
    const axiosError = new AxiosError(
      'Request failed with status code 404',
      'ERR_BAD_REQUEST',
      undefined,
      {},
      {
        status: 404,
        statusText: 'Not Found',
        headers: {},
        config: {} as any,
        data: {
          statusCode: 404,
          error: 'Not Found',
          message: "Workspace 'acme' not found",
        },
      }
    );

    const parsed = parseSDKError(axiosError);
    expect(parsed.message).toBe("Workspace 'acme' not found");
    expect(parsed.status).toBe(404);
  });

  it('should parse error object format { error: "Unauthorized" }', () => {
    const axiosError = new AxiosError(
      'Request failed with status code 401',
      'ERR_BAD_REQUEST',
      undefined,
      {},
      {
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config: {} as any,
        data: {
          error: 'Invalid session token',
        },
      }
    );

    const parsed = parseSDKError(axiosError);
    expect(parsed.message).toBe('Invalid session token');
    expect(parsed.status).toBe(401);
  });

  it('should parse nested error object format { error: { message: "Token expired" } }', () => {
    const axiosError = new AxiosError(
      'Request failed with status code 401',
      'ERR_BAD_REQUEST',
      undefined,
      {},
      {
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config: {} as any,
        data: {
          error: {
            message: 'Token expired',
            code: 'TOKEN_EXPIRED',
          },
        },
      }
    );

    const parsed = parseSDKError(axiosError);
    expect(parsed.message).toBe('Token expired');
    expect(parsed.status).toBe(401);
  });

  it('should parse string response data', () => {
    const axiosError = new AxiosError(
      'Request failed with status code 502',
      'ERR_BAD_GATEWAY',
      undefined,
      {},
      {
        status: 502,
        statusText: 'Bad Gateway',
        headers: {},
        config: {} as any,
        data: 'Bad Gateway Error from Upstream',
      }
    );

    const parsed = parseSDKError(axiosError);
    expect(parsed.message).toBe('Bad Gateway Error from Upstream');
    expect(parsed.status).toBe(502);
  });

  it('should handle network errors without response object', () => {
    const axiosError = new AxiosError(
      'Network Error',
      'ERR_NETWORK',
      undefined,
      {},
      undefined
    );

    const parsed = parseSDKError(axiosError);
    expect(parsed.message).toBe('Network Error');
    expect(parsed.status).toBeUndefined();
    expect(parsed.code).toBe('ERR_NETWORK');
  });

  it('should handle timeout errors without response object', () => {
    const axiosError = new AxiosError(
      'timeout of 10000ms exceeded',
      'ECONNABORTED',
      undefined,
      {},
      undefined
    );

    const parsed = parseSDKError(axiosError);
    expect(parsed.message).toBe('timeout of 10000ms exceeded');
    expect(parsed.code).toBe('ECONNABORTED');
  });

  it('should handle standard non-Axios Error objects', () => {
    const standardError = new TypeError('Failed to fetch');
    const parsed = parseSDKError(standardError);

    expect(parsed).toBeInstanceOf(ScrymeSDKError);
    expect(parsed.message).toBe('Failed to fetch');
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

    // Mock axios post failure
    const postSpy = vi.spyOn(axios, 'post').mockRejectedValue(
      new AxiosError('Request failed with status code 401', 'ERR_BAD_REQUEST', undefined, {}, {
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config: {} as any,
        data: { message: 'Invalid M2M client credentials' },
      })
    );

    await expect(sdk.getOrFetchToken()).rejects.toThrow(ScrymeSDKError);

    try {
      await sdk.getOrFetchToken();
    } catch (err: any) {
      expect(err).toBeInstanceOf(ScrymeSDKError);
      expect(err.message).toBe('Invalid M2M client credentials');
      expect(err.status).toBe(401);
    }

    postSpy.mockRestore();
  });
});

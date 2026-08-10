import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { ScrymeSDK } from '../sdk';

vi.mock('axios', async () => {
  const actual = await vi.importActual<typeof axios>('axios');
  return {
    default: {
      ...actual,
      create: vi.fn(() => ({
        interceptors: {
          request: { use: vi.fn(), eject: vi.fn() },
          response: { use: vi.fn(), eject: vi.fn() },
        },
        defaults: { headers: {} },
      })),
      post: vi.fn(),
    },
  };
});

// Mock the generated v3-server APIs
vi.mock('../generated/v3-server', () => {
  return {
    getSkyrmeChatAPI: vi.fn(() => ({
      v3WorkspacesControllerGetWorkspaces: vi.fn(async (options) => {
        return { success: true, data: { workspaces: [] }, options };
      }),
      v3WorkspacesControllerGetWorkspaceBySlug: vi.fn(async (slug, options) => {
        return { success: true, data: { workspace: { slug } }, options };
      }),
      channelsControllerGetWorkspaceChannels: vi.fn(async (slug, options) => {
        return { success: true, data: { channels: [] }, slug, options };
      }),
      channelsControllerCreateChannel: vi.fn(async (slug, data, options) => {
        return { success: true, data: { slug, data }, options };
      }),
      channelsControllerGetMessages: vi.fn(async (channelId, params, options) => {
        return { success: true, channelId, params, options };
      }),
      channelsControllerCreateMessage: vi.fn(async (channelId, options) => {
        return { success: true, channelId, options };
      }),
    })),
  };
});

describe('ScrymeSDK', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default baseURL', () => {
      const sdk = new ScrymeSDK();
      expect(sdk.baseURL).toContain('http://localhost:3000');
    });

    it('should initialize with custom baseURL', () => {
      const sdk = new ScrymeSDK({ baseURL: 'https://custom-api.com/' });
      expect(sdk.baseURL).toBe('https://custom-api.com');
    });

    it('should accept clientId and clientSecret options', () => {
      const sdk = new ScrymeSDK({
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
      });
      expect(sdk['clientId']).toBe('test-client-id');
      expect(sdk['clientSecret']).toBe('test-client-secret');
    });

    it('should accept static token option', async () => {
      const sdk = new ScrymeSDK({ token: 'my-static-token' });
      const token = await sdk.getOrFetchToken();
      expect(token).toBe('my-static-token');
    });
  });

  describe('OAuth Token Retrieval & Caching', () => {
    it('should fetch token via client_credentials and cache it', async () => {
      const sdk = new ScrymeSDK({
        baseURL: 'https://api.test.com',
        clientId: 'id',
        clientSecret: 'sec',
      });

      vi.mocked(axios.post).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            access_token: 'fetched-m2m-token',
            expires_in: 3600,
          },
        },
      });

      const token1 = await sdk.getOrFetchToken();
      expect(token1).toBe('fetched-m2m-token');
      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(axios.post).toHaveBeenCalledWith(
        'https://api.test.com/api/v3/oauth/token',
        {
          client_id: 'id',
          client_secret: 'sec',
          grant_type: 'client_credentials',
        },
        expect.any(Object)
      );

      // Second call should return cached token without calling axios again
      const token2 = await sdk.getOrFetchToken();
      expect(token2).toBe('fetched-m2m-token');
      expect(axios.post).toHaveBeenCalledTimes(1);
    });

    it('should refetch token if expired', async () => {
      const sdk = new ScrymeSDK({
        baseURL: 'https://api.test.com',
        clientId: 'id',
        clientSecret: 'sec',
      });

      vi.mocked(axios.post)
        .mockResolvedValueOnce({
          data: {
            success: true,
            data: {
              access_token: 'first-token',
              expires_in: -10, // Expired immediately
            },
          },
        })
        .mockResolvedValueOnce({
          data: {
            success: true,
            data: {
              access_token: 'second-token',
              expires_in: 3600,
            },
          },
        });

      const token1 = await sdk.getOrFetchToken();
      expect(token1).toBe('first-token');

      const token2 = await sdk.getOrFetchToken();
      expect(token2).toBe('second-token');
      expect(axios.post).toHaveBeenCalledTimes(2);
    });
  });

  describe('Dynamic Proxy (sdk.raw)', () => {
    it('should proxy calls and inject Bearer token and baseURL', async () => {
      const sdk = new ScrymeSDK({
        baseURL: 'https://api.test.com',
        token: 'active-token',
      });

      const result = await sdk.raw.v3WorkspacesControllerGetWorkspaces() as any;
      expect(result).toBeDefined();
      expect(result.options).toBeDefined();
      expect(result.options.baseURL).toBe('https://api.test.com/api');
      expect(result.options.headers.Authorization).toBe('Bearer active-token');
    });

    it('should merge user-provided headers with injected config', async () => {
      const sdk = new ScrymeSDK({
        baseURL: 'https://api.test.com',
        token: 'active-token',
      });

      // Passing options as the last parameter (since v3WorkspacesControllerGetWorkspaces has arity 1)
      const result = await sdk.raw.v3WorkspacesControllerGetWorkspaces({
        headers: {
          'X-Custom-Header': 'CustomValue',
        },
      } as any) as any;

      expect(result.options.headers.Authorization).toBe('Bearer active-token');
      expect(result.options.headers['X-Custom-Header']).toBe('CustomValue');
    });
  });

  describe('Nested DX Helper Namespaces', () => {
    it('should support workspace namespace', async () => {
      const sdk = new ScrymeSDK({
        baseURL: 'https://api.test.com',
        token: 'active-token',
      });

      const listRes = await sdk.workspace.list() as any;
      expect(listRes.success).toBe(true);

      const getRes = await sdk.workspace.get('acme') as any;
      expect(getRes.data.workspace.slug).toBe('acme');
    });

    it('should support workspace channels namespace', async () => {
      const sdk = new ScrymeSDK({
        baseURL: 'https://api.test.com',
        token: 'active-token',
      });

      const channelsRes = await sdk.workspace.channels.list('acme-corp') as any;
      expect(channelsRes.slug).toBe('acme-corp');

      const createRes = await sdk.workspace.channels.create('acme-corp', { name: 'general' }) as any;
      expect(createRes.data.slug).toBe('acme-corp');
      expect(createRes.data.data.name).toBe('general');
    });

    it('should support channel and message namespaces', async () => {
      const sdk = new ScrymeSDK({
        baseURL: 'https://api.test.com',
        token: 'active-token',
      });

      const messagesRes = await sdk.channel.message.list('chan_123', { limit: 10 }) as any;
      expect(messagesRes.channelId).toBe('chan_123');
      expect(messagesRes.params.limit).toBe(10);

      const createMsgRes = await sdk.channel.message.create('chan_123') as any;
      expect(createMsgRes.channelId).toBe('chan_123');
    });
  });
});

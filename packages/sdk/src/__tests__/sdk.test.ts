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
      channelsControllerUpdateMessage: vi.fn(async (channelId, messageId, data, options) => {
        return { success: true, type: 'channel', action: 'update', channelId, messageId, data, options };
      }),
      channelsControllerDeleteMessage: vi.fn(async (channelId, messageId, options) => {
        return { success: true, type: 'channel', action: 'delete', channelId, messageId, options };
      }),
      channelsControllerAddReaction: vi.fn(async (channelId, messageId, data, options) => {
        return { success: true, type: 'channel', action: 'addReaction', channelId, messageId, data, options };
      }),
      channelsControllerRemoveReaction: vi.fn(async (channelId, messageId, emoji, options) => {
        return { success: true, type: 'channel', action: 'removeReaction', channelId, messageId, emoji, options };
      }),

      // DMs Mock
      dmsControllerGetDms: vi.fn(async (options) => {
        return { success: true, conversations: [], options };
      }),
      dmsControllerCreateDm: vi.fn(async (data, options) => {
        return { success: true, data, options };
      }),
      dmsControllerGetDm: vi.fn(async (dmId, options) => {
        return { success: true, dmId, options };
      }),
      dmsControllerDeleteDm: vi.fn(async (dmId, options) => {
        return { success: true, dmId, options };
      }),
      dmsControllerGetMessages: vi.fn(async (dmId, params, options) => {
        return { success: true, dmId, params, options };
      }),
      dmsControllerCreateMessage: vi.fn(async (dmId, options) => {
        return { success: true, dmId, options };
      }),
      dmsControllerUpdateMessage: vi.fn(async (dmId, messageId, data, options) => {
        return { success: true, type: 'dm', action: 'update', dmId, messageId, data, options };
      }),
      dmsControllerDeleteMessage: vi.fn(async (dmId, messageId, options) => {
        return { success: true, type: 'dm', action: 'delete', dmId, messageId, options };
      }),
      dmsControllerAddReaction: vi.fn(async (dmId, messageId, data, options) => {
        return { success: true, type: 'dm', action: 'addReaction', dmId, messageId, data, options };
      }),
      dmsControllerRemoveReaction: vi.fn(async (dmId, messageId, emoji, options) => {
        return { success: true, type: 'dm', action: 'removeReaction', dmId, messageId, emoji, options };
      }),

      // Webhooks Mock
      v3WebhooksControllerGetWebhooks: vi.fn(async (slug, options) => {
        return { success: true, slug, options };
      }),
      v3WebhooksControllerCreateWebhook: vi.fn(async (slug, data, options) => {
        return { success: true, slug, data, options };
      }),
      v3WebhooksControllerGetWebhook: vi.fn(async (slug, webhookId, options) => {
        return { success: true, slug, webhookId, options };
      }),
      v3WebhooksControllerUpdateWebhook: vi.fn(async (slug, webhookId, data, options) => {
        return { success: true, slug, webhookId, data, options };
      }),
      v3WebhooksControllerDeleteWebhook: vi.fn(async (slug, webhookId, options) => {
        return { success: true, slug, webhookId, options };
      }),

      // Channel Incoming Webhooks Mock
      v3ChannelIncomingWebhooksControllerGetChannelWebhooks: vi.fn(async (slug, channelId, options) => {
        return { success: true, slug, channelId, options };
      }),
      v3ChannelIncomingWebhooksControllerCreateChannelWebhook: vi.fn(async (slug, channelId, data, options) => {
        return { success: true, slug, channelId, data, options };
      }),
      v3ChannelIncomingWebhooksControllerGetChannelWebhook: vi.fn(async (slug, channelId, webhookId, options) => {
        return { success: true, slug, channelId, webhookId, options };
      }),
      v3ChannelIncomingWebhooksControllerUpdateChannelWebhook: vi.fn(async (slug, channelId, webhookId, data, options) => {
        return { success: true, slug, channelId, webhookId, data, options };
      }),
      v3ChannelIncomingWebhooksControllerDeleteChannelWebhook: vi.fn(async (slug, channelId, webhookId, options) => {
        return { success: true, slug, channelId, webhookId, options };
      }),
      v3ChannelIncomingWebhooksControllerExecuteWebhookByUrlToken: vi.fn(async (token, data, options) => {
        return { success: true, token, data, options };
      }),
      v3ChannelIncomingWebhooksControllerExecuteWebhookByChannelId: vi.fn(async (channelId, data, params, options) => {
        return { success: true, channelId, data, params, options };
      }),

      // V3 Workspace M2M Mock
      v3WorkspacesControllerProvisionWorkspace: vi.fn(async (data, options) => {
        return { success: true, data, options };
      }),
      v3WorkspacesControllerUpdateWorkspace: vi.fn(async (slug, data, options) => {
        return { success: true, slug, data, options };
      }),
      v3WorkspacesControllerDeleteWorkspace: vi.fn(async (slug, options) => {
        return { success: true, slug, options };
      }),
      v3WorkspacesControllerGetWorkspaceMembers: vi.fn(async (slug, options) => {
        return { success: true, slug, options };
      }),
      v3WorkspacesControllerAddWorkspaceMember: vi.fn(async (slug, data, options) => {
        return { success: true, slug, data, options };
      }),
      v3WorkspacesControllerGetWorkspaceMember: vi.fn(async (slug, memberId, options) => {
        return { success: true, slug, memberId, options };
      }),
      v3WorkspacesControllerUpdateWorkspaceMember: vi.fn(async (slug, memberId, data, options) => {
        return { success: true, slug, memberId, data, options };
      }),
      v3WorkspacesControllerDeleteWorkspaceMember: vi.fn(async (slug, memberId, options) => {
        return { success: true, slug, memberId, options };
      }),
      v3OAuthControllerGetToken: vi.fn(async (data, options) => {
        return { success: true, data, options };
      }),

      // Support Controller Mock
      supportControllerCreateTicket: vi.fn(async (options) => {
        return { success: true, ticket: options?.data, options };
      }),
      supportControllerGetTickets: vi.fn(async (params, options) => {
        return { success: true, workspaceId: params?.workspaceId, tickets: [], options };
      }),
      supportControllerStartLiveChat: vi.fn(async (options) => {
        return { success: true, session: options?.data, options };
      }),
      supportControllerEndLiveChat: vi.fn(async (sessionId, options) => {
        return { success: true, sessionId, options };
      }),
      supportControllerUpdateTicketStatus: vi.fn(async (ticketId, options) => {
        return { success: true, ticketId, status: options?.data?.status, options };
      }),
      supportControllerAssignTicket: vi.fn(async (ticketId, options) => {
        return { success: true, ticketId, assigneeId: options?.data?.assigneeId, options };
      }),
      supportControllerCreateCustomerProfile: vi.fn(async (options) => {
        return { success: true, profile: options?.data, options };
      }),
      supportControllerGetCustomerProfiles: vi.fn(async (params, options) => {
        return { success: true, workspaceId: params?.workspaceId, profiles: [], options };
      }),
    })),
  };
});

describe('ScrymeSDK', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default baseURL without /api suffix', () => {
      const sdk = new ScrymeSDK();
      expect(sdk.baseURL).toContain('http://localhost:3000');
      expect(sdk.baseURL).not.toContain('/api');
    });

    it('should initialize with custom baseURL stripping trailing slash', () => {
      const sdk = new ScrymeSDK({ baseURL: 'https://custom-api.com/' });
      expect(sdk.baseURL).toBe('https://custom-api.com');
    });

    it('should strip /api suffix from custom baseURL if provided', () => {
      const sdk = new ScrymeSDK({ baseURL: 'https://custom-api.com/api' });
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
      expect(result.options.baseURL).toBe('https://api.test.com');
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

      // Channel message create (with string)
      const createMsgStrRes = await sdk.channel.message.create('chan_123', 'Hello') as any;
      expect(createMsgStrRes.channelId).toBe('chan_123');
      expect(createMsgStrRes.options.data.content).toBe('Hello');

      // Channel message create (with object)
      const createMsgObjRes = await sdk.channel.message.create('chan_123', { content: 'Hello World' }) as any;
      expect(createMsgObjRes.options.data.content).toBe('Hello World');
    });

    it('should support dm.message namespaces', async () => {
      const sdk = new ScrymeSDK({
        baseURL: 'https://api.test.com',
        token: 'active-token',
      });

      // DM list
      const listDmsRes = await sdk.dm.list() as any;
      expect(listDmsRes.conversations).toBeDefined();

      // DM create
      const createDmRes = await sdk.dm.create({ userId: 'user_123' }) as any;
      expect(createDmRes.data.userId).toBe('user_123');

      // DM message list
      const messagesRes = await sdk.dm.message.list('dm_123', { limit: 5 }) as any;
      expect(messagesRes.dmId).toBe('dm_123');
      expect(messagesRes.params.limit).toBe(5);

      // DM message create (with string)
      const createMsgStrRes = await sdk.dm.message.create('dm_123', 'Hello DM') as any;
      expect(createMsgStrRes.dmId).toBe('dm_123');
      expect(createMsgStrRes.options.data.content).toBe('Hello DM');

      // DM message create (with object)
      const createMsgObjRes = await sdk.dm.message.create('dm_123', { content: 'Hello DM Object' }) as any;
      expect(createMsgObjRes.options.data.content).toBe('Hello DM Object');
    });

    it('should route message update/delete/reaction dynamically based on "dm-" prefix', async () => {
      const sdk = new ScrymeSDK({
        baseURL: 'https://api.test.com',
        token: 'active-token',
      });

      // Standard Channel message update
      const chanUpdate = await sdk.message.update('chan_123', 'msg_1', { content: 'updated content' }) as any;
      expect(chanUpdate.type).toBe('channel');
      expect(chanUpdate.action).toBe('update');

      // DM message update
      const dmUpdate = await sdk.message.update('dm-123', 'msg_1', { content: 'updated content' }) as any;
      expect(dmUpdate.type).toBe('dm');
      expect(dmUpdate.action).toBe('update');

      // Standard Channel message delete
      const chanDelete = await sdk.message.delete('chan_123', 'msg_1') as any;
      expect(chanDelete.type).toBe('channel');

      // DM message delete
      const dmDelete = await sdk.message.delete('dm-123', 'msg_1') as any;
      expect(dmDelete.type).toBe('dm');

      // Standard Channel message addReaction
      const chanAddReaction = await sdk.message.addReaction('chan_123', 'msg_1', { emoji: '👍' }) as any;
      expect(chanAddReaction.type).toBe('channel');

      // DM message addReaction
      const dmAddReaction = await sdk.message.addReaction('dm-123', 'msg_1', { emoji: '👍' }) as any;
      expect(dmAddReaction.type).toBe('dm');
    });

    it('should support webhooks and channel incoming webhooks namespace', async () => {
      const sdk = new ScrymeSDK({
        baseURL: 'https://api.test.com',
        token: 'active-token',
      });

      // Standard Webhooks
      const createWh = await sdk.webhooks.create('acme', { name: 'wh1', url: 'http://wh', events: ['*'] }) as any;
      expect(createWh.slug).toBe('acme');
      expect(createWh.data.name).toBe('wh1');

      const listWh = await sdk.webhooks.list('acme') as any;
      expect(listWh.slug).toBe('acme');

      // Incoming Webhooks
      const createInWh = await sdk.webhooks.incoming.create('acme', 'chan_123', { name: 'incoming_wh' }) as any;
      expect(createInWh.slug).toBe('acme');
      expect(createInWh.channelId).toBe('chan_123');
      expect(createInWh.data.name).toBe('incoming_wh');
    });

    it('should support sdk.m2m operations namespace', async () => {
      const sdk = new ScrymeSDK({
        baseURL: 'https://api.test.com',
        token: 'active-token',
      });

      // m2m.workspace.provision
      const provRes = await sdk.m2m.workspace.provision({ name: 'Acme', ownerEmail: 'a@acme.com', slug: 'acme' }) as any;
      expect(provRes.data.name).toBe('Acme');

      // m2m.member.add
      const addMem = await sdk.m2m.member.add('acme', { email: 'user@acme.com', role: 'admin' }) as any;
      expect(addMem.slug).toBe('acme');
      expect(addMem.data.email).toBe('user@acme.com');

      // m2m.auth.token
      const tokenRes = await sdk.m2m.auth.token('cid', 'sec') as any;
      expect(tokenRes.data.client_id).toBe('cid');
    });

    it('should support sdk.support ticketing and customer operations', async () => {
      const sdk = new ScrymeSDK({
        baseURL: 'https://api.test.com',
        token: 'active-token',
      });

      // support.createTicket
      const ticketDto = { workspaceId: 'ws-123', subject: 'Billing Issue', initialMessage: 'Need help with invoice' };
      const createRes = await sdk.support.createTicket(ticketDto) as any;
      expect(createRes.success).toBe(true);
      expect(createRes.ticket).toEqual(ticketDto);

      // support.getTickets
      const getRes = await sdk.support.getTickets('ws-123') as any;
      expect(getRes.success).toBe(true);
      expect(getRes.workspaceId).toBe('ws-123');

      // support.updateStatus
      const statusRes = await sdk.support.updateStatus('t-1', 'RESOLVED') as any;
      expect(statusRes.success).toBe(true);
      expect(statusRes.ticketId).toBe('t-1');
      expect(statusRes.status).toBe('RESOLVED');

      // support.assignTicket
      const assignRes = await sdk.support.assignTicket('t-1', 'agent-99') as any;
      expect(assignRes.success).toBe(true);
      expect(assignRes.ticketId).toBe('t-1');
      expect(assignRes.assigneeId).toBe('agent-99');

      // support.tickets sub-namespace
      const ticketSubCreate = await sdk.support.tickets.create(ticketDto) as any;
      expect(ticketSubCreate.ticket).toEqual(ticketDto);

      const ticketSubList = await sdk.support.tickets.list('ws-123') as any;
      expect(ticketSubList.workspaceId).toBe('ws-123');

      const ticketSubStatus = await sdk.support.tickets.updateStatus('t-2', 'CLOSED') as any;
      expect(ticketSubStatus.status).toBe('CLOSED');

      const ticketSubAssign = await sdk.support.tickets.assign('t-2', null) as any;
      expect(ticketSubAssign.assigneeId).toBeNull();

      // support.liveChat sub-namespace
      const liveChatStart = await sdk.support.liveChat.start({ workspaceId: 'ws-123', metadata: { source: 'web' } }) as any;
      expect(liveChatStart.session.workspaceId).toBe('ws-123');

      const liveChatEnd = await sdk.support.liveChat.end('session-789') as any;
      expect(liveChatEnd.sessionId).toBe('session-789');

      // support.customer sub-namespace
      const custDto = { workspaceId: 'ws-123', userId: 'usr-1', company: 'Acme Corp' };
      const custCreate = await sdk.support.customer.createProfile(custDto) as any;
      expect(custCreate.profile).toEqual(custDto);

      const custGet = await sdk.support.customer.getProfiles('ws-123') as any;
      expect(custGet.workspaceId).toBe('ws-123');
    });
  });
});

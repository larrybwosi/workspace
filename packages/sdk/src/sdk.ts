import axios, { AxiosRequestConfig } from 'axios';
import { setGlobalToken } from './custom-instance';
import { getSkyrmeChatAPI } from './generated/v3-server';
import type {
  V3ProvisionWorkspaceDto,
  V3UpdateWorkspaceDto,
  V3AddMemberDto,
  V3UpdateMemberRoleDto,
  CreateWorkspaceChannelDto,
  UpdateWorkspaceChannelDto,
  ChannelsControllerGetMessagesParams,
  ChannelsControllerUpdateMessageBody,
  ChannelsControllerAddReactionBody,
  CreateDmDto,
  UpdateDmMessageDto,
  MarkAsReadDto,
  UsersControllerSearchUsersParams,
  DmsControllerGetMessagesParams,
  V3WorkspacesControllerGetWorkspacesResult,
  V3WorkspacesControllerGetWorkspaceBySlugResult,
  V3WorkspacesControllerProvisionWorkspaceResult,
  V3WorkspacesControllerUpdateWorkspaceResult,
  V3WorkspacesControllerDeleteWorkspaceResult,
  V3WorkspacesControllerGetWorkspaceMembersResult,
  V3WorkspacesControllerAddWorkspaceMemberResult,
  V3WorkspacesControllerGetWorkspaceMemberResult,
  V3WorkspacesControllerUpdateWorkspaceMemberResult,
  V3WorkspacesControllerDeleteWorkspaceMemberResult,
  ChannelsControllerGetWorkspaceChannelsResult,
  ChannelsControllerCreateChannelResult,
  ChannelsControllerGetChannelResult,
  ChannelsControllerUpdateChannelResult,
  ChannelsControllerDeleteChannelResult,
  ChannelsControllerGetMessagesResult,
  ChannelsControllerCreateMessageResult,
  ChannelsControllerUpdateMessageResult,
  ChannelsControllerDeleteMessageResult,
  ChannelsControllerAddReactionResult,
  ChannelsControllerRemoveReactionResult,
  DmsControllerGetDmsResult,
  DmsControllerCreateDmResult,
  DmsControllerGetDmResult,
  DmsControllerDeleteDmResult,
  DmsControllerGetMessagesResult,
  DmsControllerCreateMessageResult,
  UsersControllerGetMeResult,
  UsersControllerGetUserResult,
  UsersControllerSearchUsersResult,
} from './generated/v3-server';

export interface ScrymeSDKOptions {
  baseURL?: string;
  clientId?: string;
  clientSecret?: string;
  token?: string;
}

export class ScrymeSDK {
  private token: string | null = null;
  private tokenExpiresAt: number | null = null;
  public baseURL: string;
  private clientId?: string;
  private clientSecret?: string;

  private syncToken(token: string | null) {
    if (!token) return;
    setGlobalToken(token);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('bearer_token', token);
      window.localStorage.setItem('better-auth.session-token', token);
      window.localStorage.setItem('better-auth.session_token', token);
    }
  }

  constructor(options: ScrymeSDKOptions = {}) {
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    this.token = options.token || null;

    if (this.token) {
      this.syncToken(this.token);
    }

    let url = options.baseURL || '';
    if (!url && typeof window !== 'undefined') {
      url = window.localStorage.getItem('CUSTOM_API_URL') || '';
    }
    if (!url) {
      const g = globalThis as typeof globalThis & {
        process?: { env?: Record<string, string> };
        __env__?: Record<string, string>;
      };
      const env = g.process?.env || g.__env__ || {};
      const isProd =
        env.NODE_ENV === 'production' ||
        (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1');

      url =
        env.API_URL ||
        env.NEXT_PUBLIC_API_URL ||
        env.VITE_API_URL ||
        (isProd ? 'https://api.chat.scryme.tech' : 'http://localhost:3000');
    }
    this.baseURL = url.replace(/\/$/, '');
  }

  /**
   * Automatically retrieves or refreshes the M2M OAuth2 Token using client_credentials
   */
  public async getOrFetchToken(): Promise<string | null> {
    // If we already have a token and it is not expired, return it
    if (this.token && (!this.tokenExpiresAt || this.tokenExpiresAt > Date.now())) {
      return this.token;
    }

    if (this.clientId && this.clientSecret) {
      try {
        const response = await axios.post(
          `${this.baseURL}/api/v3/oauth/token`,
          {
            client_id: this.clientId,
            client_secret: this.clientSecret,
            grant_type: 'client_credentials',
          },
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (response.data?.success && response.data?.data?.access_token) {
          this.token = response.data.data.access_token;
          this.syncToken(this.token);
          if (response.data.data.expires_in) {
            // Expire 10 seconds early as a safety buffer
            this.tokenExpiresAt = Date.now() + (response.data.data.expires_in - 10) * 1000;
          } else {
            this.tokenExpiresAt = null;
          }
          return this.token;
        } else if (response.data?.access_token) {
          // Fallback in case response is not wrapped
          this.token = response.data.access_token;
          this.syncToken(this.token);
          if (response.data.expires_in) {
            this.tokenExpiresAt = Date.now() + (response.data.expires_in - 10) * 1000;
          } else {
            this.tokenExpiresAt = null;
          }
          return this.token;
        }
      } catch (error) {
        console.error('ScrymeSDK failed to authenticate via client_credentials:', error);
        throw error;
      }
    }

    return this.token;
  }

  /**
   * Gets the axios request config containing authorization and base url
   */
  private async getRequestConfig(): Promise<any> {
    const token = await this.getOrFetchToken();
    return {
      baseURL: `${this.baseURL}/api`,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
  }

  /**
   * Dynamic proxy that maps to the generated server API methods from Orval,
   * injecting authentication token and baseURL automatically.
   */
  public get raw(): ReturnType<typeof getSkyrmeChatAPI> {
    const rawMethods = getSkyrmeChatAPI();
    return new Proxy(rawMethods, {
      get: (target, prop) => {
        const originalMethod = Reflect.get(target, prop);
        if (typeof originalMethod === 'function') {
          return async (...args: any[]) => {
            const config = await this.getRequestConfig();
            const arity = originalMethod.length;
            const newArgs = [...args];

            // Orval generated functions accept `options` as their last parameter.
            // If the user provided options, we merge them with our default request config.
            if (args.length >= arity && typeof args[args.length - 1] === 'object') {
              const userOptions = args[args.length - 1];
              newArgs[args.length - 1] = {
                ...userOptions,
                baseURL: config.baseURL,
                headers: {
                  ...config.headers,
                  ...userOptions.headers,
                },
              };
            } else {
              // Otherwise, we pad missing parameters with undefined and append our config as the options object.
              while (newArgs.length < arity - 1) {
                newArgs.push(undefined);
              }
              newArgs.push(config);
            }

            return originalMethod(...newArgs);
          };
        }
        return originalMethod;
      },
    }) as any;
  }

  // --- High-level nested namespace chains for excellent DX ---

  public get workspace() {
    return {
      list: async (options?: AxiosRequestConfig): Promise<V3WorkspacesControllerGetWorkspacesResult> => {
        return this.raw.v3WorkspacesControllerGetWorkspaces(options) as any;
      },
      get: async (slug: string, options?: AxiosRequestConfig): Promise<V3WorkspacesControllerGetWorkspaceBySlugResult> => {
        return this.raw.v3WorkspacesControllerGetWorkspaceBySlug(slug, options) as any;
      },
      create: async (data: V3ProvisionWorkspaceDto, options?: AxiosRequestConfig): Promise<V3WorkspacesControllerProvisionWorkspaceResult> => {
        return this.raw.v3WorkspacesControllerProvisionWorkspace(data, options) as any;
      },
      update: async (slug: string, data: V3UpdateWorkspaceDto, options?: AxiosRequestConfig): Promise<V3WorkspacesControllerUpdateWorkspaceResult> => {
        return this.raw.v3WorkspacesControllerUpdateWorkspace(slug, data, options) as any;
      },
      delete: async (slug: string, options?: AxiosRequestConfig): Promise<V3WorkspacesControllerDeleteWorkspaceResult> => {
        return this.raw.v3WorkspacesControllerDeleteWorkspace(slug, options) as any;
      },
      members: {
        list: async (slug: string, options?: AxiosRequestConfig): Promise<V3WorkspacesControllerGetWorkspaceMembersResult> => {
          return this.raw.v3WorkspacesControllerGetWorkspaceMembers(slug, options) as any;
        },
        add: async (slug: string, data: V3AddMemberDto, options?: AxiosRequestConfig): Promise<V3WorkspacesControllerAddWorkspaceMemberResult> => {
          return this.raw.v3WorkspacesControllerAddWorkspaceMember(slug, data, options) as any;
        },
        get: async (slug: string, memberId: string, options?: AxiosRequestConfig): Promise<V3WorkspacesControllerGetWorkspaceMemberResult> => {
          return this.raw.v3WorkspacesControllerGetWorkspaceMember(slug, memberId, options) as any;
        },
        update: async (slug: string, memberId: string, data: V3UpdateMemberRoleDto, options?: AxiosRequestConfig): Promise<V3WorkspacesControllerUpdateWorkspaceMemberResult> => {
          return this.raw.v3WorkspacesControllerUpdateWorkspaceMember(slug, memberId, data, options) as any;
        },
        delete: async (slug: string, memberId: string, options?: AxiosRequestConfig): Promise<V3WorkspacesControllerDeleteWorkspaceMemberResult> => {
          return this.raw.v3WorkspacesControllerDeleteWorkspaceMember(slug, memberId, options) as any;
        },
      },
      channels: {
        list: async (slug: string, options?: AxiosRequestConfig): Promise<ChannelsControllerGetWorkspaceChannelsResult> => {
          return this.raw.channelsControllerGetWorkspaceChannels(slug, options) as any;
        },
        create: async (slug: string, data: CreateWorkspaceChannelDto, options?: AxiosRequestConfig): Promise<ChannelsControllerCreateChannelResult> => {
          return this.raw.channelsControllerCreateChannel(slug, data, options) as any;
        },
      },
    };
  }

  public get channel() {
    return {
      get: async (slug: string, channelId: string, options?: AxiosRequestConfig): Promise<ChannelsControllerGetChannelResult> => {
        return this.raw.channelsControllerGetChannel(slug, channelId, options) as any;
      },
      update: async (slug: string, channelId: string, data: UpdateWorkspaceChannelDto, options?: AxiosRequestConfig): Promise<ChannelsControllerUpdateChannelResult> => {
        return this.raw.channelsControllerUpdateChannel(slug, channelId, data, options) as any;
      },
      delete: async (slug: string, channelId: string, options?: AxiosRequestConfig): Promise<ChannelsControllerDeleteChannelResult> => {
        return this.raw.channelsControllerDeleteChannel(slug, channelId, options) as any;
      },
      message: {
        list: async (channelId: string, params?: ChannelsControllerGetMessagesParams, options?: AxiosRequestConfig): Promise<ChannelsControllerGetMessagesResult> => {
          return this.raw.channelsControllerGetMessages(channelId, params, options) as any;
        },
        create: async (channelId: string, options?: AxiosRequestConfig): Promise<ChannelsControllerCreateMessageResult> => {
          return this.raw.channelsControllerCreateMessage(channelId, options) as any;
        },
      },
    };
  }

  public get message() {
    return {
      update: async (channelId: string, messageId: string, data: ChannelsControllerUpdateMessageBody, options?: AxiosRequestConfig): Promise<ChannelsControllerUpdateMessageResult> => {
        return this.raw.channelsControllerUpdateMessage(channelId, messageId, data, options) as any;
      },
      delete: async (channelId: string, messageId: string, options?: AxiosRequestConfig): Promise<ChannelsControllerDeleteMessageResult> => {
        return this.raw.channelsControllerDeleteMessage(channelId, messageId, options) as any;
      },
      addReaction: async (channelId: string, messageId: string, data: ChannelsControllerAddReactionBody, options?: AxiosRequestConfig): Promise<ChannelsControllerAddReactionResult> => {
        return this.raw.channelsControllerAddReaction(channelId, messageId, data, options) as any;
      },
      removeReaction: async (channelId: string, messageId: string, emoji: string, options?: AxiosRequestConfig): Promise<ChannelsControllerRemoveReactionResult> => {
        return this.raw.channelsControllerRemoveReaction(channelId, messageId, emoji, options) as any;
      },
    };
  }

  public get dm() {
    return {
      list: async (options?: AxiosRequestConfig): Promise<DmsControllerGetDmsResult> => {
        return this.raw.dmsControllerGetDms(options) as any;
      },
      create: async (data: CreateDmDto, options?: AxiosRequestConfig): Promise<DmsControllerCreateDmResult> => {
        return this.raw.dmsControllerCreateDm(data, options) as any;
      },
      get: async (dmId: string, options?: AxiosRequestConfig): Promise<DmsControllerGetDmResult> => {
        return this.raw.dmsControllerGetDm(dmId, options) as any;
      },
      delete: async (dmId: string, options?: AxiosRequestConfig): Promise<DmsControllerDeleteDmResult> => {
        return this.raw.dmsControllerDeleteDm(dmId, options) as any;
      },
      message: {
        list: async (dmId: string, params?: DmsControllerGetMessagesParams, options?: AxiosRequestConfig): Promise<DmsControllerGetMessagesResult> => {
          return this.raw.dmsControllerGetMessages(dmId, params, options) as any;
        },
        create: async (dmId: string, options?: AxiosRequestConfig): Promise<DmsControllerCreateMessageResult> => {
          return this.raw.dmsControllerCreateMessage(dmId, options) as any;
        },
      },
    };
  }

  public get user() {
    return {
      me: async (options?: AxiosRequestConfig): Promise<UsersControllerGetMeResult> => {
        return this.raw.usersControllerGetMe(options) as any;
      },
      get: async (userId: string, options?: AxiosRequestConfig): Promise<UsersControllerGetUserResult> => {
        return this.raw.usersControllerGetUser(userId, options) as any;
      },
      search: async (params: UsersControllerSearchUsersParams, options?: AxiosRequestConfig): Promise<UsersControllerSearchUsersResult> => {
        return this.raw.usersControllerSearchUsers(params, options) as any;
      },
    };
  }
}

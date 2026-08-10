import axios, { AxiosRequestConfig } from 'axios';
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
  V3WorkspacesControllerGetWorkspaces200,
  V3WorkspacesControllerGetWorkspaceBySlug200,
  V3WorkspacesControllerProvisionWorkspace201,
  V3WorkspacesControllerUpdateWorkspace200,
  V3WorkspacesControllerDeleteWorkspace200,
  DmsControllerGetMessagesParams,
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

  constructor(options: ScrymeSDKOptions = {}) {
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    this.token = options.token || null;

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
      list: async (options?: AxiosRequestConfig): Promise<V3WorkspacesControllerGetWorkspaces200> => {
        return this.raw.v3WorkspacesControllerGetWorkspaces(options);
      },
      get: async (slug: string, options?: AxiosRequestConfig): Promise<V3WorkspacesControllerGetWorkspaceBySlug200> => {
        return this.raw.v3WorkspacesControllerGetWorkspaceBySlug(slug, options);
      },
      create: async (data: V3ProvisionWorkspaceDto, options?: AxiosRequestConfig): Promise<V3WorkspacesControllerProvisionWorkspace201> => {
        return this.raw.v3WorkspacesControllerProvisionWorkspace(data, options);
      },
      update: async (slug: string, data: V3UpdateWorkspaceDto, options?: AxiosRequestConfig): Promise<V3WorkspacesControllerUpdateWorkspace200> => {
        return this.raw.v3WorkspacesControllerUpdateWorkspace(slug, data, options);
      },
      delete: async (slug: string, options?: AxiosRequestConfig): Promise<V3WorkspacesControllerDeleteWorkspace200> => {
        return this.raw.v3WorkspacesControllerDeleteWorkspace(slug, options);
      },
      members: {
        list: async (slug: string, options?: AxiosRequestConfig): Promise<any> => {
          return this.raw.v3WorkspacesControllerGetWorkspaceMembers(slug, options);
        },
        add: async (slug: string, data: V3AddMemberDto, options?: AxiosRequestConfig): Promise<any> => {
          return this.raw.v3WorkspacesControllerAddWorkspaceMember(slug, data, options);
        },
        get: async (slug: string, memberId: string, options?: AxiosRequestConfig): Promise<any> => {
          return this.raw.v3WorkspacesControllerGetWorkspaceMember(slug, memberId, options);
        },
        update: async (slug: string, memberId: string, data: V3UpdateMemberRoleDto, options?: AxiosRequestConfig): Promise<any> => {
          return this.raw.v3WorkspacesControllerUpdateWorkspaceMember(slug, memberId, data, options);
        },
        delete: async (slug: string, memberId: string, options?: AxiosRequestConfig): Promise<any> => {
          return this.raw.v3WorkspacesControllerDeleteWorkspaceMember(slug, memberId, options);
        },
      },
      channels: {
        list: async (slug: string, options?: AxiosRequestConfig): Promise<any> => {
          return this.raw.channelsControllerGetWorkspaceChannels(slug, options);
        },
        create: async (slug: string, data: CreateWorkspaceChannelDto, options?: AxiosRequestConfig): Promise<any> => {
          return this.raw.channelsControllerCreateChannel(slug, data, options);
        },
      },
    };
  }

  public get channel() {
    return {
      get: async (slug: string, channelId: string, options?: AxiosRequestConfig): Promise<any> => {
        return this.raw.channelsControllerGetChannel(slug, channelId, options);
      },
      update: async (slug: string, channelId: string, data: UpdateWorkspaceChannelDto, options?: AxiosRequestConfig): Promise<any> => {
        return this.raw.channelsControllerUpdateChannel(slug, channelId, data, options);
      },
      delete: async (slug: string, channelId: string, options?: AxiosRequestConfig): Promise<any> => {
        return this.raw.channelsControllerDeleteChannel(slug, channelId, options);
      },
      message: {
        list: async (channelId: string, params?: ChannelsControllerGetMessagesParams, options?: AxiosRequestConfig): Promise<any> => {
          return this.raw.channelsControllerGetMessages(channelId, params, options);
        },
        create: async (channelId: string, options?: AxiosRequestConfig): Promise<any> => {
          return this.raw.channelsControllerCreateMessage(channelId, options);
        },
      },
    };
  }

  public get message() {
    return {
      update: async (channelId: string, messageId: string, data: ChannelsControllerUpdateMessageBody, options?: AxiosRequestConfig): Promise<any> => {
        return this.raw.channelsControllerUpdateMessage(channelId, messageId, data, options);
      },
      delete: async (channelId: string, messageId: string, options?: AxiosRequestConfig): Promise<any> => {
        return this.raw.channelsControllerDeleteMessage(channelId, messageId, options);
      },
      addReaction: async (channelId: string, messageId: string, data: ChannelsControllerAddReactionBody, options?: AxiosRequestConfig): Promise<any> => {
        return this.raw.channelsControllerAddReaction(channelId, messageId, data, options);
      },
      removeReaction: async (channelId: string, messageId: string, emoji: string, options?: AxiosRequestConfig): Promise<any> => {
        return this.raw.channelsControllerRemoveReaction(channelId, messageId, emoji, options);
      },
    };
  }

  public get dm() {
    return {
      list: async (options?: AxiosRequestConfig): Promise<any> => {
        return this.raw.dmsControllerGetDms(options);
      },
      create: async (data: CreateDmDto, options?: AxiosRequestConfig): Promise<any> => {
        return this.raw.dmsControllerCreateDm(data, options);
      },
      get: async (dmId: string, options?: AxiosRequestConfig): Promise<any> => {
        return this.raw.dmsControllerGetDm(dmId, options);
      },
      delete: async (dmId: string, options?: AxiosRequestConfig): Promise<any> => {
        return this.raw.dmsControllerDeleteDm(dmId, options);
      },
      message: {
        list: async (dmId: string, params?: DmsControllerGetMessagesParams, options?: AxiosRequestConfig): Promise<any> => {
          return this.raw.dmsControllerGetMessages(dmId, params, options);
        },
        create: async (dmId: string, options?: AxiosRequestConfig): Promise<any> => {
          return this.raw.dmsControllerCreateMessage(dmId, options);
        },
      },
    };
  }

  public get user() {
    return {
      me: async (options?: AxiosRequestConfig): Promise<any> => {
        return this.raw.usersControllerGetMe(options);
      },
      get: async (userId: string, options?: AxiosRequestConfig): Promise<any> => {
        return this.raw.usersControllerGetUser(userId, options);
      },
      search: async (params: UsersControllerSearchUsersParams, options?: AxiosRequestConfig): Promise<any> => {
        return this.raw.usersControllerSearchUsers(params, options);
      },
    };
  }
}

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
  CreateMessageDto,
  V3CreateWebhookDto,
  V3UpdateWebhookDto,
  CreateChannelIncomingWebhookDto,
  UpdateChannelIncomingWebhookDto,
  ExecuteChannelIncomingWebhookDto,
  V3ChannelIncomingWebhooksControllerExecuteWebhookByChannelIdParams,
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

// --- High-fidelity Response and Entity Interfaces for Excellent DX ---

/**
 * Represents a workspace in the Scryme platform (Enterprise M2M API V3).
 */
export interface V3Workspace {
  /** Unique workspace identifier. */
  id: string;
  /** Display name of the workspace. */
  name: string;
  /** Unique URL-friendly slug representing the workspace. */
  slug: string;
  /** Description of the workspace. */
  description?: string | null;
  /** Icon identifier or URL. */
  icon?: string | null;
  /** Industry categorization of the workspace. */
  industry?: string | null;
  /** Custom branding configuration object. */
  brandingConfig?: any;
  /** ISO timestamp when the workspace was created. */
  createdAt: string;
  /** ISO timestamp when the workspace was last updated. */
  updatedAt?: string;
}

/**
 * Envelope response containing a list of workspaces.
 */
export interface V3WorkspacesResponse {
  /** Indicates whether the API call was successful. */
  success: boolean;
  /** The payload of the response containing the workspaces. */
  data: {
    /** List of workspaces returned by the API. */
    workspaces: V3Workspace[];
  };
  /** ISO timestamp of when the response was generated. */
  timestamp: string;
}

/**
 * Envelope response containing a single workspace.
 */
export interface V3WorkspaceResponse {
  /** Indicates whether the API call was successful. */
  success: boolean;
  /** The payload of the response containing the workspace. */
  data: {
    /** The retrieved workspace details. */
    workspace: V3Workspace;
  };
  /** ISO timestamp of when the response was generated. */
  timestamp: string;
}

/**
 * Envelope response containing provisioned workspace details and its default system bot.
 */
export interface V3ProvisionWorkspaceResponse {
  /** Indicates whether the API call was successful. */
  success: boolean;
  /** The payload containing details of the newly provisioned workspace and bot. */
  data: {
    /** Basic details of the provisioned workspace. */
    workspace: {
      /** Unique workspace identifier. */
      id: string;
      /** Display name of the workspace. */
      name: string;
      /** Unique slug for the workspace. */
      slug: string;
    };
    /** Details of the automatically generated system bot for the workspace. */
    bot: {
      /** Unique identifier of the bot. */
      id: string;
      /** Client ID used for bot authentication. */
      clientId: string;
      /** Client Secret used for bot authentication. */
      clientSecret: string;
    };
  };
  /** ISO timestamp of when the response was generated. */
  timestamp: string;
}

/**
 * Envelope response containing workspace deletion confirmation.
 */
export interface V3DeleteWorkspaceResponse {
  /** Indicates whether the API call was successful. */
  success: boolean;
  /** The payload indicating deletion status. */
  data: {
    /** True if the workspace was deleted successfully. */
    success: boolean;
  };
  /** ISO timestamp of when the response was generated. */
  timestamp: string;
}

/**
 * Details of a member belonging to a workspace.
 */
export interface V3WorkspaceMember {
  /** Unique membership identifier. */
  id: string;
  /** Unique workspace identifier. */
  workspaceId: string;
  /** Unique user identifier. */
  userId: string;
  /** Associated department identifier if the member is assigned to one. */
  departmentId?: string | null;
  /** The member's role (e.g., owner, admin, moderator, member, guest). */
  role: string;
  /** Type of member (e.g., regular user, bot, guest). */
  memberType: string;
  /** ISO timestamp of when the member joined the workspace. */
  joinedAt: string;
  /** Member's notification preferences. */
  notificationPreference: string;
  /** Nested basic details of the member's user profile. */
  user: {
    /** Unique user identifier. */
    id: string;
    /** Full name of the user. */
    name: string;
    /** Email address of the user. */
    email: string;
    /** URL to the user's avatar image. */
    avatar?: string | null;
    /** Current status message or indicator of the user. */
    status?: string | null;
  };
}

/**
 * Envelope response containing a list of workspace members.
 */
export interface V3WorkspaceMembersResponse {
  /** Indicates whether the API call was successful. */
  success: boolean;
  /** The payload containing workspace members. */
  data: {
    /** List of members belonging to the workspace. */
    members: V3WorkspaceMember[];
  };
  /** ISO timestamp of when the response was generated. */
  timestamp: string;
}

/**
 * Envelope response containing a newly added workspace member.
 */
export interface V3AddWorkspaceMemberResponse {
  /** Indicates whether the API call was successful. */
  success: boolean;
  /** The payload containing the added workspace member. */
  data: {
    /** Details of the added member. */
    member: V3WorkspaceMember;
  };
  /** ISO timestamp of when the response was generated. */
  timestamp: string;
}

/**
 * Envelope response containing details of a specific workspace member.
 */
export interface V3GetWorkspaceMemberResponse {
  /** Indicates whether the API call was successful. */
  success: boolean;
  /** The payload containing the workspace member details. */
  data: {
    /** Details of the workspace member. */
    member: V3WorkspaceMember;
  };
  /** ISO timestamp of when the response was generated. */
  timestamp: string;
}

/**
 * Envelope response containing the updated workspace member details.
 */
export interface V3UpdateWorkspaceMemberResponse {
  /** Indicates whether the API call was successful. */
  success: boolean;
  /** The payload containing the updated workspace member. */
  data: {
    /** Details of the updated member. */
    member: V3WorkspaceMember;
  };
  /** ISO timestamp of when the response was generated. */
  timestamp: string;
}

/**
 * Envelope response containing workspace member removal confirmation.
 */
export interface V3DeleteWorkspaceMemberResponse {
  /** Indicates whether the API call was successful. */
  success: boolean;
  /** The payload indicating deletion status. */
  data: {
    /** True if the workspace member was removed successfully. */
    success: boolean;
  };
  /** ISO timestamp of when the response was generated. */
  timestamp: string;
}

/**
 * Represents a channel in a workspace.
 */
export interface WorkspaceChannel {
  /** Unique channel identifier. */
  id: string;
  /** Display name of the channel. */
  name: string;
  /** Unique URL-friendly slug representing the channel. */
  slug: string;
  /** Optional icon name or identifier for the channel. */
  icon?: string;
  /** Type of the channel. */
  type: 'public' | 'private';
  /** Optional descriptive text about the channel. */
  description?: string | null;
  /** True if the channel is private and restricted. */
  isPrivate: boolean;
  /** Unique workspace identifier. */
  workspaceId: string;
  /** Optional parent channel or category identifier. */
  parentId?: string | null;
  /** ISO timestamp when the channel was created. */
  createdAt: string;
  /** ISO timestamp when the channel was last updated. */
  updatedAt: string;
  /** Unread message count in this channel for the active user. */
  unreadCount?: number;
  /** Mentions count in this channel for the active user. */
  mentionCount?: number;
}

/**
 * Represents a message sent to a workspace channel or direct message conversation.
 */
export interface ChannelMessage {
  /** Unique message identifier. */
  id: string;
  /** The text content of the message. */
  content: string;
  /** ISO timestamp when the message was sent. */
  createdAt: string;
  /** ISO timestamp when the message was last updated. */
  updatedAt: string;
  /** The unique channel identifier if sent within a channel. */
  channelId: string;
  /** Unique identifier of the user who sent the message. */
  userId: string;
  /** Basic profile details of the user who sent the message. */
  user: {
    /** Unique user identifier. */
    id: string;
    /** Display name of the user. */
    name: string;
    /** Username of the user. */
    username?: string;
    /** URL to the user's avatar image. */
    avatar?: string | null;
  };
  /** Optional identifier of the message this message is replying to. */
  replyToId?: string | null;
  /** Optional identifier of the root thread message. */
  threadId?: string | null;
  /** Optional attachments uploaded with the message. */
  attachments?: any[];
  /** Reactions associated with this message. */
  reactions?: any[];
}

/**
 * Represents a direct message conversation between users.
 */
export interface DmConversation {
  /** Unique conversation identifier. */
  id: string;
  /** ISO timestamp when the DM conversation was created. */
  createdAt: string;
  /** ISO timestamp when the DM conversation was last updated. */
  updatedAt: string;
  /** List of participant profiles in this conversation. */
  participants: {
    /** Participant record ID. */
    id: string;
    /** Unique user ID of the participant. */
    userId: string;
    /** Associated conversation ID. */
    conversationId: string;
    /** Profile details of the participant user. */
    user: {
      /** Unique user identifier. */
      id: string;
      /** Display name of the user. */
      name: string;
      /** Username of the user. */
      username?: string;
      /** URL to the user's avatar image. */
      avatar?: string | null;
    };
  }[];
  /** Messages belonging to this DM conversation. */
  messages?: any[];
  /** Metadata count summaries for the conversation. */
  _count?: {
    /** Total number of messages in the conversation. */
    messages: number;
  };
}

/**
 * Public or private profile information of a user.
 */
export interface UserProfile {
  /** Unique user identifier. */
  id: string;
  /** Display name of the user. */
  name: string;
  /** Unique username of the user. */
  username: string;
  /** Email address of the user (available only on self profile or with appropriate access). */
  email?: string;
  /** URL to the user's avatar image. */
  avatar?: string | null;
  /** Current status message or custom presence text. */
  status?: string | null;
  /** Global application role of the user (e.g., admin, member). */
  role?: string;
  /** ISO timestamp when the user account was created. */
  createdAt?: string;
}

/**
 * Configuration options for initializing the Scryme SDK.
 */
export interface ScrymeSDKOptions {
  /**
   * The base URL of the Scryme API server.
   * If not provided, the SDK will automatically resolve it from localStorage or environment variables.
   */
  baseURL?: string;
  /** OAuth2 Client ID for Machine-to-Machine (M2M) authentication. */
  clientId?: string;
  /** OAuth2 Client Secret for Machine-to-Machine (M2M) authentication. */
  clientSecret?: string;
  /** Static Bearer token or pre-fetched session token. */
  token?: string;
}

/**
 * The primary client SDK class for accessing the Scryme Chat platform APIs.
 * Supports automated OAuth2 Token management and provides clean, type-safe namespaces.
 */
export class ScrymeSDK {
  /** The currently cached access token. */
  private token: string | null = null;
  /** Timestamp in milliseconds indicating when the cached token will expire. */
  private tokenExpiresAt: number | null = null;
  /** Normalized base URL of the target API server. */
  public baseURL: string;
  /** OAuth2 Client ID used for client credentials flow. */
  private clientId?: string;
  /** OAuth2 Client Secret used for client credentials flow. */
  private clientSecret?: string;

  /**
   * Synchronizes the authentication token to local storage and the global configuration.
   * @param token The token to synchronize.
   */
  private syncToken(token: string | null) {
    if (!token) return;
    setGlobalToken(token);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('bearer_token', token);
      window.localStorage.setItem('better-auth.session-token', token);
      window.localStorage.setItem('better-auth.session_token', token);
    }
  }

  /**
   * Constructs a new ScrymeSDK instance.
   * @param options Configuration options for baseURL, tokens, and credentials.
   */
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
        (typeof window !== 'undefined' &&
          window.location.hostname !== 'localhost' &&
          window.location.hostname !== '127.0.0.1');

      url =
        env.API_URL ||
        env.NEXT_PUBLIC_API_URL ||
        env.VITE_API_URL ||
        (isProd ? 'https://api.chat.scryme.tech' : 'http://localhost:3000');
    }
    this.baseURL = url.replace(/\/$/, '');
  }

  /**
   * Automatically retrieves a cached token, or fetches a new one via M2M OAuth2 Client Credentials
   * if a clientId and clientSecret are configured.
   * @returns A promise resolving to the token string, or null if unauthenticated.
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
   * Generates the default request configuration containing the authorization headers and baseURL.
   * @returns Request configuration object.
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

  /**
   * Operations for managing workspaces, including creation, updating, retrieval,
   * members, and channels.
   */
  public get workspace() {
    return {
      /**
       * Lists all workspaces in the authenticated organization context.
       * @param options Optional request config override.
       * @returns List of workspaces returned exactly from the endpoint.
       */
      list: async (options?: AxiosRequestConfig): Promise<V3WorkspacesResponse> => {
        return this.raw.v3WorkspacesControllerGetWorkspaces(options) as any;
      },
      /**
       * Retrieves detailed information of a specific workspace by its slug.
       * @param slug The unique workspace slug identifier.
       * @param options Optional request config override.
       * @returns Workspace details returned exactly from the endpoint.
       */
      get: async (slug: string, options?: AxiosRequestConfig): Promise<V3WorkspaceResponse> => {
        return this.raw.v3WorkspacesControllerGetWorkspaceBySlug(slug, options) as any;
      },
      /**
       * Provisions a new workspace inside the organization.
       * @param data Workspace creation and configuration data.
       * @param options Optional request config override.
       * @returns Provisioned workspace and bot configuration exactly from the endpoint.
       */
      create: async (
        data: V3ProvisionWorkspaceDto,
        options?: AxiosRequestConfig
      ): Promise<V3ProvisionWorkspaceResponse> => {
        return this.raw.v3WorkspacesControllerProvisionWorkspace(data, options) as any;
      },
      /**
       * Updates the configurations and metadata of an existing workspace.
       * @param slug The unique workspace slug identifier.
       * @param data Fields to update.
       * @param options Optional request config override.
       * @returns The updated workspace details exactly from the endpoint.
       */
      update: async (
        slug: string,
        data: V3UpdateWorkspaceDto,
        options?: AxiosRequestConfig
      ): Promise<V3WorkspaceResponse> => {
        return this.raw.v3WorkspacesControllerUpdateWorkspace(slug, data, options) as any;
      },
      /**
       * Permanently deletes a specific workspace by its slug.
       * @param slug The unique workspace slug identifier.
       * @param options Optional request config override.
       * @returns Deletion status response exactly from the endpoint.
       */
      delete: async (slug: string, options?: AxiosRequestConfig): Promise<V3DeleteWorkspaceResponse> => {
        return this.raw.v3WorkspacesControllerDeleteWorkspace(slug, options) as any;
      },
      /**
       * Operations for managing workspace members, including listing, adding, role updates, and removal.
       */
      members: {
        /**
         * Lists all members currently in a workspace.
         * @param slug The unique workspace slug identifier.
         * @param options Optional request config override.
         * @returns List of workspace members exactly from the endpoint.
         */
        list: async (slug: string, options?: AxiosRequestConfig): Promise<V3WorkspaceMembersResponse> => {
          return this.raw.v3WorkspacesControllerGetWorkspaceMembers(slug, options) as any;
        },
        /**
         * Adds a new member to the workspace.
         * @param slug The unique workspace slug identifier.
         * @param data Input DTO containing the user's email and role.
         * @param options Optional request config override.
         * @returns Newly added member details exactly from the endpoint.
         */
        add: async (
          slug: string,
          data: V3AddMemberDto,
          options?: AxiosRequestConfig
        ): Promise<V3AddWorkspaceMemberResponse> => {
          return this.raw.v3WorkspacesControllerAddWorkspaceMember(slug, data, options) as any;
        },
        /**
         * Retrieves membership details of a specific member in a workspace.
         * @param slug The unique workspace slug identifier.
         * @param memberId Unique ID of the workspace member (user ID).
         * @param options Optional request config override.
         * @returns Workspace member details exactly from the endpoint.
         */
        get: async (
          slug: string,
          memberId: string,
          options?: AxiosRequestConfig
        ): Promise<V3GetWorkspaceMemberResponse> => {
          return this.raw.v3WorkspacesControllerGetWorkspaceMember(slug, memberId, options) as any;
        },
        /**
         * Updates the role or configuration of a workspace member.
         * @param slug The unique workspace slug identifier.
         * @param memberId Unique ID of the workspace member (user ID).
         * @param data Update details containing the target role.
         * @param options Optional request config override.
         * @returns The updated workspace member details exactly from the endpoint.
         */
        update: async (
          slug: string,
          memberId: string,
          data: V3UpdateMemberRoleDto,
          options?: AxiosRequestConfig
        ): Promise<V3UpdateWorkspaceMemberResponse> => {
          return this.raw.v3WorkspacesControllerUpdateWorkspaceMember(slug, memberId, data, options) as any;
        },
        /**
         * Removes a member from the workspace.
         * @param slug The unique workspace slug identifier.
         * @param memberId Unique ID of the workspace member (user ID).
         * @param options Optional request config override.
         * @returns Workspace member deletion confirmation exactly from the endpoint.
         */
        delete: async (
          slug: string,
          memberId: string,
          options?: AxiosRequestConfig
        ): Promise<V3DeleteWorkspaceMemberResponse> => {
          return this.raw.v3WorkspacesControllerDeleteWorkspaceMember(slug, memberId, options) as any;
        },
      },
      /**
       * Operations for listing and creating channels inside a workspace.
       */
      channels: {
        /**
         * Lists all public channels (and private channels the user has access to) in a workspace.
         * @param slug The unique workspace slug identifier.
         * @param options Optional request config override.
         * @returns List of channels returned exactly from the endpoint.
         */
        list: async (slug: string, options?: AxiosRequestConfig): Promise<WorkspaceChannel[]> => {
          return this.raw.channelsControllerGetWorkspaceChannels(slug, options) as any;
        },
        /**
         * Creates a new channel within a workspace.
         * @param slug The unique workspace slug identifier.
         * @param data Configuration DTO for the new channel.
         * @param options Optional request config override.
         * @returns Details of the created channel exactly from the endpoint.
         */
        create: async (
          slug: string,
          data: CreateWorkspaceChannelDto,
          options?: AxiosRequestConfig
        ): Promise<WorkspaceChannel> => {
          return this.raw.channelsControllerCreateChannel(slug, data, options) as any;
        },
      },
    };
  }

  /**
   * Operations for managing specific channels and channel message actions.
   */
  public get channel() {
    return {
      /**
       * Retrieves detailed information of a specific channel.
       * @param slug The unique workspace slug identifier.
       * @param channelId Unique identifier of the channel.
       * @param options Optional request config override.
       * @returns Channel details returned exactly from the endpoint.
       */
      get: async (slug: string, channelId: string, options?: AxiosRequestConfig): Promise<WorkspaceChannel> => {
        return this.raw.channelsControllerGetChannel(slug, channelId, options) as any;
      },
      /**
       * Updates configuration, description, icon or status of an existing channel.
       * @param slug The unique workspace slug identifier.
       * @param channelId Unique identifier of the channel.
       * @param data Configuration options to update.
       * @param options Optional request config override.
       * @returns The updated channel details exactly from the endpoint.
       */
      update: async (
        slug: string,
        channelId: string,
        data: UpdateWorkspaceChannelDto,
        options?: AxiosRequestConfig
      ): Promise<WorkspaceChannel> => {
        return this.raw.channelsControllerUpdateChannel(slug, channelId, data, options) as any;
      },
      /**
       * Permanently deletes a channel from a workspace.
       * @param slug The unique workspace slug identifier.
       * @param channelId Unique identifier of the channel to delete.
       * @param options Optional request config override.
       * @returns Success status indicating that the channel was deleted exactly from the endpoint.
       */
      delete: async (slug: string, channelId: string, options?: AxiosRequestConfig): Promise<{ success: boolean }> => {
        return this.raw.channelsControllerDeleteChannel(slug, channelId, options) as any;
      },
      /**
       * Sub-namespace for managing messages inside a channel.
       */
      message: {
        /**
         * Lists messages in a channel with cursor pagination support.
         * @param channelId Unique identifier of the channel.
         * @param params Query parameters for limiting, sorting, or pagination cursors.
         * @param options Optional request config override.
         * @returns Object containing the messages array and next pagination cursor exactly from the endpoint.
         */
        list: async (
          channelId: string,
          params?: ChannelsControllerGetMessagesParams,
          options?: AxiosRequestConfig
        ): Promise<{ messages: ChannelMessage[]; nextCursor?: string }> => {
          return this.raw.channelsControllerGetMessages(channelId, params, options) as any;
        },
        /**
         * Sends a new message to a channel.
         * @param channelId Unique identifier of the target channel.
         * @param data The message content string or structured CreateMessageDto object.
         * @param options Optional request config override.
         * @returns The created message exactly from the endpoint.
         */
        create: async (
          channelId: string,
          data: CreateMessageDto | string,
          options?: AxiosRequestConfig
        ): Promise<ChannelMessage> => {
          const payload = typeof data === 'string' ? { content: data } : data;
          return this.raw.channelsControllerCreateMessage(channelId, {
            ...options,
            data: payload,
          }) as any;
        },
        /**
         * Updates the content of a previously sent message in a channel.
         * @param channelId Unique identifier of the channel containing the message.
         * @param messageId Unique identifier of the message to update.
         * @param data The new content payload.
         * @param options Optional request config override.
         * @returns The updated message details exactly from the endpoint.
         */
        update: async (
          channelId: string,
          messageId: string,
          data: ChannelsControllerUpdateMessageBody,
          options?: AxiosRequestConfig
        ): Promise<ChannelMessage> => {
          return this.raw.channelsControllerUpdateMessage(channelId, messageId, data, options) as any;
        },
        /**
         * Permanently deletes a message in a channel.
         * @param channelId Unique identifier of the channel containing the message.
         * @param messageId Unique identifier of the message to delete.
         * @param options Optional request config override.
         * @returns Success status indicating that the message was deleted exactly from the endpoint.
         */
        delete: async (
          channelId: string,
          messageId: string,
          options?: AxiosRequestConfig
        ): Promise<{ success: boolean }> => {
          return this.raw.channelsControllerDeleteMessage(channelId, messageId, options) as any;
        },
        /**
         * Adds a reaction (emoji) to a message in a channel.
         * @param channelId Unique identifier of the channel containing the message.
         * @param messageId Unique identifier of the message.
         * @param data Object containing the target emoji character.
         * @param options Optional request config override.
         * @returns The reaction response returned exactly from the endpoint.
         */
        addReaction: async (
          channelId: string,
          messageId: string,
          data: ChannelsControllerAddReactionBody,
          options?: AxiosRequestConfig
        ): Promise<any> => {
          return this.raw.channelsControllerAddReaction(channelId, messageId, data, options) as any;
        },
        /**
         * Removes a reaction (emoji) from a message in a channel.
         * @param channelId Unique identifier of the channel containing the message.
         * @param messageId Unique identifier of the message.
         * @param emoji The emoji character to remove.
         * @param options Optional request config override.
         * @returns The reaction removal response returned exactly from the endpoint.
         */
        removeReaction: async (
          channelId: string,
          messageId: string,
          emoji: string,
          options?: AxiosRequestConfig
        ): Promise<any> => {
          return this.raw.channelsControllerRemoveReaction(channelId, messageId, emoji, options) as any;
        },
      },
    };
  }

  /**
   * Operations for modifying, reacting to, or deleting existing messages (both channel & direct messages).
   * Automatically intercepts direct messages starting with 'dm-' and routes them correctly.
   */
  public get message() {
    return {
      /**
       * Updates the content of a previously sent message.
       * @param channelId Unique identifier of the channel or DM conversation containing the message.
       * @param messageId Unique identifier of the message to update.
       * @param data The new content payload.
       * @param options Optional request config override.
       * @returns The updated message details exactly from the endpoint.
       */
      update: async (
        channelId: string,
        messageId: string,
        data: ChannelsControllerUpdateMessageBody | UpdateDmMessageDto,
        options?: AxiosRequestConfig
      ): Promise<ChannelMessage> => {
        if (channelId.startsWith('dm-')) {
          return this.raw.dmsControllerUpdateMessage(channelId, messageId, data as any, options) as any;
        }
        return this.raw.channelsControllerUpdateMessage(channelId, messageId, data, options) as any;
      },
      /**
       * Permanently deletes a message.
       * @param channelId Unique identifier of the channel or DM conversation containing the message.
       * @param messageId Unique identifier of the message to delete.
       * @param options Optional request config override.
       * @returns Success status indicating that the message was deleted exactly from the endpoint.
       */
      delete: async (
        channelId: string,
        messageId: string,
        options?: AxiosRequestConfig
      ): Promise<{ success: boolean }> => {
        if (channelId.startsWith('dm-')) {
          return this.raw.dmsControllerDeleteMessage(channelId, messageId, options) as any;
        }
        return this.raw.channelsControllerDeleteMessage(channelId, messageId, options) as any;
      },
      /**
       * Adds a reaction (emoji) to a message.
       * @param channelId Unique identifier of the channel or DM conversation containing the message.
       * @param messageId Unique identifier of the message.
       * @param data Object containing the target emoji character.
       * @param options Optional request config override.
       * @returns The reaction response returned exactly from the endpoint.
       */
      addReaction: async (
        channelId: string,
        messageId: string,
        data: ChannelsControllerAddReactionBody | { emoji?: string },
        options?: AxiosRequestConfig
      ): Promise<any> => {
        if (channelId.startsWith('dm-')) {
          return this.raw.dmsControllerAddReaction(channelId, messageId, data as any, options) as any;
        }
        return this.raw.channelsControllerAddReaction(channelId, messageId, data, options) as any;
      },
      /**
       * Removes a reaction (emoji) from a message.
       * @param channelId Unique identifier of the channel or DM conversation containing the message.
       * @param messageId Unique identifier of the message.
       * @param emoji The emoji character to remove.
       * @param options Optional request config override.
       * @returns The reaction removal response returned exactly from the endpoint.
       */
      removeReaction: async (
        channelId: string,
        messageId: string,
        emoji: string,
        options?: AxiosRequestConfig
      ): Promise<any> => {
        if (channelId.startsWith('dm-')) {
          return this.raw.dmsControllerRemoveReaction(channelId, messageId, emoji, options) as any;
        }
        return this.raw.channelsControllerRemoveReaction(channelId, messageId, emoji, options) as any;
      },
    };
  }

  /**
   * Operations for managing direct messages (DMs) and direct message conversations.
   */
  public get dm() {
    return {
      /**
       * Lists all active direct message conversations for the authenticated user.
       * @param options Optional request config override.
       * @returns List of active DM conversations returned exactly from the endpoint.
       */
      list: async (options?: AxiosRequestConfig): Promise<DmConversation[]> => {
        return this.raw.dmsControllerGetDms(options) as any;
      },
      /**
       * Creates/initiates a direct message conversation with specified users.
       * @param data Create direct message details containing target participant IDs.
       * @param options Optional request config override.
       * @returns Details of the created DM conversation exactly from the endpoint.
       */
      create: async (data: CreateDmDto, options?: AxiosRequestConfig): Promise<DmConversation> => {
        return this.raw.dmsControllerCreateDm(data, options) as any;
      },
      /**
       * Retrieves details of a specific direct message conversation.
       * @param dmId Unique identifier of the direct message conversation.
       * @param options Optional request config override.
       * @returns Detailed direct message conversation object exactly from the endpoint.
       */
      get: async (dmId: string, options?: AxiosRequestConfig): Promise<DmConversation> => {
        return this.raw.dmsControllerGetDm(dmId, options) as any;
      },
      /**
       * Deletes/closes an active direct message conversation.
       * @param dmId Unique identifier of the direct message conversation to close.
       * @param options Optional request config override.
       * @returns Success status indicating that the DM conversation was deleted exactly from the endpoint.
       */
      delete: async (dmId: string, options?: AxiosRequestConfig): Promise<{ success: boolean }> => {
        return this.raw.dmsControllerDeleteDm(dmId, options) as any;
      },
      /**
       * Sub-namespace for managing direct messages in a specific DM conversation.
       */
      message: {
        /**
         * Lists messages in a direct message conversation with cursor pagination.
         * @param dmId Unique identifier of the direct message conversation.
         * @param params Query parameters for pagination limits, cursors or search filters.
         * @param options Optional request config override.
         * @returns List of direct messages and next pagination cursor exactly from the endpoint.
         */
        list: async (
          dmId: string,
          params?: DmsControllerGetMessagesParams,
          options?: AxiosRequestConfig
        ): Promise<{ messages: ChannelMessage[]; nextCursor?: string }> => {
          return this.raw.dmsControllerGetMessages(dmId, params, options) as any;
        },
        /**
         * Sends a new message in a direct message conversation.
         * @param dmId Unique identifier of the direct message conversation.
         * @param data The message content string or structured CreateMessageDto object.
         * @param options Optional request config override.
         * @returns The sent message exactly from the endpoint.
         */
        create: async (
          dmId: string,
          data: CreateMessageDto | { content: string } | string,
          options?: AxiosRequestConfig
        ): Promise<ChannelMessage> => {
          const payload = typeof data === 'string' ? { content: data } : data;
          return this.raw.dmsControllerCreateMessage(dmId, {
            ...options,
            data: payload,
          }) as any;
        },
        /**
         * Updates the content of a previously sent direct message.
         * @param dmId Unique identifier of the direct message conversation.
         * @param messageId Unique identifier of the message to update.
         * @param data The new content payload.
         * @param options Optional request config override.
         * @returns The updated message details exactly from the endpoint.
         */
        update: async (
          dmId: string,
          messageId: string,
          data: UpdateDmMessageDto,
          options?: AxiosRequestConfig
        ): Promise<ChannelMessage> => {
          return this.raw.dmsControllerUpdateMessage(dmId, messageId, data, options) as any;
        },
        /**
         * Permanently deletes a direct message.
         * @param dmId Unique identifier of the direct message conversation.
         * @param messageId Unique identifier of the message to delete.
         * @param options Optional request config override.
         * @returns Success status indicating that the message was deleted exactly from the endpoint.
         */
        delete: async (
          dmId: string,
          messageId: string,
          options?: AxiosRequestConfig
        ): Promise<{ success: boolean }> => {
          return this.raw.dmsControllerDeleteMessage(dmId, messageId, options) as any;
        },
        /**
         * Adds a reaction (emoji) to a direct message.
         * @param dmId Unique identifier of the direct message conversation.
         * @param messageId Unique identifier of the message.
         * @param data Object containing the target emoji character.
         * @param options Optional request config override.
         * @returns The reaction response returned exactly from the endpoint.
         */
        addReaction: async (
          dmId: string,
          messageId: string,
          data: { emoji: string },
          options?: AxiosRequestConfig
        ): Promise<any> => {
          return this.raw.dmsControllerAddReaction(dmId, messageId, data, options) as any;
        },
        /**
         * Removes a reaction (emoji) from a direct message.
         * @param dmId Unique identifier of the direct message conversation.
         * @param messageId Unique identifier of the message.
         * @param emoji The emoji character to remove.
         * @param options Optional request config override.
         * @returns The reaction removal response returned exactly from the endpoint.
         */
        removeReaction: async (
          dmId: string,
          messageId: string,
          emoji: string,
          options?: AxiosRequestConfig
        ): Promise<any> => {
          return this.raw.dmsControllerRemoveReaction(dmId, messageId, emoji, options) as any;
        },
      },
    };
  }

  /**
   * Operations for retrieving information about the current user or other user profiles,
   * as well as performing user searches.
   */
  public get user() {
    return {
      /**
       * Retrieves the profile details of the currently authenticated user.
       * @param options Optional request config override.
       * @returns The active user's profile returned exactly from the endpoint.
       */
      me: async (options?: AxiosRequestConfig): Promise<UserProfile> => {
        return this.raw.usersControllerGetMe(options) as any;
      },
      /**
       * Retrieves the public profile of a user by their user ID.
       * @param userId Unique identifier of the target user.
       * @param options Optional request config override.
       * @returns Public user profile returned exactly from the endpoint.
       */
      get: async (userId: string, options?: AxiosRequestConfig): Promise<UserProfile> => {
        return this.raw.usersControllerGetUser(userId, options) as any;
      },
      /**
       * Searches the organization or workspace directory for user profiles matching specific queries.
       * @param params Object containing search filters and query string parameters.
       * @param options Optional request config override.
       * @returns List of matching user profiles returned exactly from the endpoint.
       */
      search: async (
        params: UsersControllerSearchUsersParams,
        options?: AxiosRequestConfig
      ): Promise<UserProfile[]> => {
        return this.raw.usersControllerSearchUsers(params, options) as any;
      },
    };
  }

  /**
   * Operations for managing webhooks (both standard workspace webhooks and channel incoming webhooks).
   */
  public get webhooks() {
    return {
      /**
       * Lists all configured webhooks for a workspace. Requires webhooks:read scope.
       * @param slug The unique workspace slug.
       * @param options Optional request config override.
       */
      list: async (slug: string, options?: AxiosRequestConfig): Promise<any> => {
        return this.raw.v3WebhooksControllerGetWebhooks(slug, options) as any;
      },
      /**
       * Creates a new standard webhook for a workspace. Requires webhooks:write scope.
       * @param slug The unique workspace slug.
       * @param data Configuration options for the standard webhook.
       * @param options Optional request config override.
       */
      create: async (slug: string, data: V3CreateWebhookDto, options?: AxiosRequestConfig): Promise<any> => {
        return this.raw.v3WebhooksControllerCreateWebhook(slug, data, options) as any;
      },
      /**
       * Retrieves details of a specific webhook. Requires webhooks:read scope.
       * @param slug The unique workspace slug.
       * @param webhookId The unique webhook identifier.
       * @param options Optional request config override.
       */
      get: async (slug: string, webhookId: string, options?: AxiosRequestConfig): Promise<any> => {
        return this.raw.v3WebhooksControllerGetWebhook(slug, webhookId, options) as any;
      },
      /**
       * Updates a standard webhook for a workspace. Requires webhooks:write scope.
       * @param slug The unique workspace slug.
       * @param webhookId The unique webhook identifier.
       * @param data Fields to update on the webhook.
       * @param options Optional request config override.
       */
      update: async (
        slug: string,
        webhookId: string,
        data: V3UpdateWebhookDto,
        options?: AxiosRequestConfig
      ): Promise<any> => {
        return this.raw.v3WebhooksControllerUpdateWebhook(slug, webhookId, data, options) as any;
      },
      /**
       * Permanently deletes a standard webhook. Requires webhooks:write scope.
       * @param slug The unique workspace slug.
       * @param webhookId The unique webhook identifier.
       * @param options Optional request config override.
       */
      delete: async (slug: string, webhookId: string, options?: AxiosRequestConfig): Promise<any> => {
        return this.raw.v3WebhooksControllerDeleteWebhook(slug, webhookId, options) as any;
      },

      /**
       * Sub-namespace for managing channel incoming webhooks.
       */
      incoming: {
        /**
         * Lists incoming webhooks configured for a specific channel. Requires webhooks:read scope.
         * @param slug The unique workspace slug.
         * @param channelId The unique channel identifier.
         * @param options Optional request config override.
         */
        list: async (slug: string, channelId: string, options?: AxiosRequestConfig): Promise<any> => {
          return this.raw.v3ChannelIncomingWebhooksControllerGetChannelWebhooks(slug, channelId, options) as any;
        },
        /**
         * Creates an incoming webhook for a specific channel. Requires webhooks:write scope.
         * @param slug The unique workspace slug.
         * @param channelId The unique channel identifier.
         * @param data Configuration options for the incoming webhook.
         * @param options Optional request config override.
         */
        create: async (
          slug: string,
          channelId: string,
          data: CreateChannelIncomingWebhookDto,
          options?: AxiosRequestConfig
        ): Promise<any> => {
          return this.raw.v3ChannelIncomingWebhooksControllerCreateChannelWebhook(slug, channelId, data, options) as any;
        },
        /**
         * Retrieves details of a specific channel incoming webhook. Requires webhooks:read scope.
         * @param slug The unique workspace slug.
         * @param channelId The unique channel identifier.
         * @param webhookId The unique webhook identifier.
         * @param options Optional request config override.
         */
        get: async (slug: string, channelId: string, webhookId: string, options?: AxiosRequestConfig): Promise<any> => {
          return this.raw.v3ChannelIncomingWebhooksControllerGetChannelWebhook(slug, channelId, webhookId, options) as any;
        },
        /**
         * Updates a channel incoming webhook. Requires webhooks:write scope.
         * @param slug The unique workspace slug.
         * @param channelId The unique channel identifier.
         * @param webhookId The unique webhook identifier.
         * @param data Fields to update on the incoming webhook.
         * @param options Optional request config override.
         */
        update: async (
          slug: string,
          channelId: string,
          webhookId: string,
          data: UpdateChannelIncomingWebhookDto,
          options?: AxiosRequestConfig
        ): Promise<any> => {
          return this.raw.v3ChannelIncomingWebhooksControllerUpdateChannelWebhook(
            slug,
            channelId,
            webhookId,
            data,
            options
          ) as any;
        },
        /**
         * Deletes a channel incoming webhook. Requires webhooks:write scope.
         * @param slug The unique workspace slug.
         * @param channelId The unique channel identifier.
         * @param webhookId The unique webhook identifier.
         * @param options Optional request config override.
         */
        delete: async (
          slug: string,
          channelId: string,
          webhookId: string,
          options?: AxiosRequestConfig
        ): Promise<any> => {
          return this.raw.v3ChannelIncomingWebhooksControllerDeleteChannelWebhook(slug, channelId, webhookId, options) as any;
        },
        /**
         * Executes an incoming webhook using its unique url token directly. No auth headers required.
         * @param token The unique webhook token from the webhook URL.
         * @param data The payload payload consisting of content/attachments/metadata.
         * @param options Optional request config override.
         */
        executeByUrlToken: async (
          token: string,
          data: ExecuteChannelIncomingWebhookDto,
          options?: AxiosRequestConfig
        ): Promise<any> => {
          return this.raw.v3ChannelIncomingWebhooksControllerExecuteWebhookByUrlToken(token, data, options) as any;
        },
        /**
         * Executes an incoming webhook by channel ID.
         * @param channelId The target channel identifier.
         * @param data The payload payload consisting of content/attachments/metadata.
         * @param params Optional query parameters like token or signature.
         * @param options Optional request config override.
         */
        executeByChannelId: async (
          channelId: string,
          data: ExecuteChannelIncomingWebhookDto,
          params?: V3ChannelIncomingWebhooksControllerExecuteWebhookByChannelIdParams,
          options?: AxiosRequestConfig
        ): Promise<any> => {
          return this.raw.v3ChannelIncomingWebhooksControllerExecuteWebhookByChannelId(
            channelId,
            data,
            params,
            options
          ) as any;
        },
      },
    };
  }

  /**
   * First-class namespace for Machine-to-Machine (M2M) operations,
   * grouping V3 Enterprise M2M APIs into logical, highly cohesive spaces.
   */
  public get m2m() {
    return {
      /**
       * M2M Workspace Operations (Provisioning, Retrieval, and Lifecycle management).
       */
      workspace: {
        /**
         * Provisions a brand new tenant workspace in the organization.
         * @param data Configuration payload for workspace name, slug, owner, and initial setups.
         * @param options Optional request config override.
         */
        provision: async (
          data: V3ProvisionWorkspaceDto,
          options?: AxiosRequestConfig
        ): Promise<V3ProvisionWorkspaceResponse> => {
          return this.raw.v3WorkspacesControllerProvisionWorkspace(data, options) as any;
        },
        /**
         * Retrieves detailed information of a specific workspace by its slug.
         * @param slug The unique workspace slug.
         * @param options Optional request config override.
         */
        get: async (slug: string, options?: AxiosRequestConfig): Promise<V3WorkspaceResponse> => {
          return this.raw.v3WorkspacesControllerGetWorkspaceBySlug(slug, options) as any;
        },
        /**
         * Lists all workspaces under the organization context.
         * @param options Optional request config override.
         */
        list: async (options?: AxiosRequestConfig): Promise<V3WorkspacesResponse> => {
          return this.raw.v3WorkspacesControllerGetWorkspaces(options) as any;
        },
        /**
         * Updates configuration and branding metadata of a specific workspace.
         * @param slug The unique workspace slug.
         * @param data Workspace update DTO.
         * @param options Optional request config override.
         */
        update: async (
          slug: string,
          data: V3UpdateWorkspaceDto,
          options?: AxiosRequestConfig
        ): Promise<V3WorkspaceResponse> => {
          return this.raw.v3WorkspacesControllerUpdateWorkspace(slug, data, options) as any;
        },
        /**
         * Permanently deletes a specific workspace by its slug.
         * @param slug The unique workspace slug.
         * @param options Optional request config override.
         */
        delete: async (slug: string, options?: AxiosRequestConfig): Promise<V3DeleteWorkspaceResponse> => {
          return this.raw.v3WorkspacesControllerDeleteWorkspace(slug, options) as any;
        },
      },

      /**
       * M2M Workspace Membership Operations (Adding, modifying roles, and removing workspace members).
       */
      member: {
        /**
         * Lists all members currently in a workspace.
         * @param slug The unique workspace slug.
         * @param options Optional request config override.
         */
        list: async (slug: string, options?: AxiosRequestConfig): Promise<V3WorkspaceMembersResponse> => {
          return this.raw.v3WorkspacesControllerGetWorkspaceMembers(slug, options) as any;
        },
        /**
         * Adds a new member to a workspace.
         * @param slug The unique workspace slug.
         * @param data Configuration containing user email and target role.
         * @param options Optional request config override.
         */
        add: async (
          slug: string,
          data: V3AddMemberDto,
          options?: AxiosRequestConfig
        ): Promise<V3AddWorkspaceMemberResponse> => {
          return this.raw.v3WorkspacesControllerAddWorkspaceMember(slug, data, options) as any;
        },
        /**
         * Retrieves membership details of a specific workspace member.
         * @param slug The unique workspace slug.
         * @param memberId Unique ID of the workspace member (user ID).
         * @param options Optional request config override.
         */
        get: async (
          slug: string,
          memberId: string,
          options?: AxiosRequestConfig
        ): Promise<V3GetWorkspaceMemberResponse> => {
          return this.raw.v3WorkspacesControllerGetWorkspaceMember(slug, memberId, options) as any;
        },
        /**
         * Updates the role or settings of an existing member in a workspace.
         * @param slug The unique workspace slug.
         * @param memberId Unique ID of the workspace member (user ID).
         * @param data Updated role.
         * @param options Optional request config override.
         */
        update: async (
          slug: string,
          memberId: string,
          data: V3UpdateMemberRoleDto,
          options?: AxiosRequestConfig
        ): Promise<V3UpdateWorkspaceMemberResponse> => {
          return this.raw.v3WorkspacesControllerUpdateWorkspaceMember(slug, memberId, data, options) as any;
        },
        /**
         * Removes a member from a workspace.
         * @param slug The unique workspace slug.
         * @param memberId Unique ID of the workspace member (user ID).
         * @param options Optional request config override.
         */
        delete: async (
          slug: string,
          memberId: string,
          options?: AxiosRequestConfig
        ): Promise<V3DeleteWorkspaceMemberResponse> => {
          return this.raw.v3WorkspacesControllerDeleteWorkspaceMember(slug, memberId, options) as any;
        },
      },

      /**
       * M2M Authentication and Token Management Utilities.
       */
      auth: {
        /**
         * Explicitly exchanges Client Credentials for a V3 access token.
         * @param clientId The unique M2M Client ID.
         * @param clientSecret The secure M2M Client Secret.
         * @param options Optional request config override.
         */
        token: async (clientId: string, clientSecret: string, options?: AxiosRequestConfig): Promise<any> => {
          return this.raw.v3OAuthControllerGetToken(
            {
              client_id: clientId,
              client_secret: clientSecret,
              grant_type: 'client_credentials',
            },
            options
          ) as any;
        },
        /**
         * Dynamically retrieves the current cached M2M token, or proactively fetches a new one.
         */
        getOrFetchToken: async (): Promise<string | null> => {
          return this.getOrFetchToken();
        },
      },
    };
  }
}

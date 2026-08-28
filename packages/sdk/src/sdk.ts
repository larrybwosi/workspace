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
  DmsControllerAddReactionBody,
  DmsControllerAddReactionResult,
  DmsControllerRemoveReactionResult,
  V3WebhooksControllerGetWebhooksResult,
  V3WebhooksControllerCreateWebhookResult,
  V3WebhooksControllerGetWebhookResult,
  V3WebhooksControllerUpdateWebhookResult,
  V3WebhooksControllerDeleteWebhookResult,
  V3ChannelIncomingWebhooksControllerGetChannelWebhooksResult,
  V3ChannelIncomingWebhooksControllerCreateChannelWebhookResult,
  V3ChannelIncomingWebhooksControllerGetChannelWebhookResult,
  V3ChannelIncomingWebhooksControllerUpdateChannelWebhookResult,
  V3ChannelIncomingWebhooksControllerDeleteChannelWebhookResult,
  V3ChannelIncomingWebhooksControllerExecuteWebhookByUrlTokenResult,
  V3ChannelIncomingWebhooksControllerExecuteWebhookByChannelIdResult,
  V3OAuthControllerGetTokenResult,
} from './generated/v3-server';

// --- High-fidelity Response and Entity Interfaces for Excellent DX ---

/**
 * Represents a message attachment.
 */
export interface MessageAttachment {
  id: string;
  messageId?: string | null;
  name: string;
  type: string;
  url: string;
  size?: string | null;
  createdAt: string;
}

/**
 * Represents a user reaction to a message.
 */
export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  customEmojiId?: string | null;
  createdAt: string;
}

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
  brandingConfig?: Record<string, unknown> | null;
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
  attachments?: MessageAttachment[];
  /** Reactions associated with this message. */
  reactions?: MessageReaction[];
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
  messages?: ChannelMessage[];
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
 * Represents a customer profile for support and CRM tracking.
 */
export interface CustomerProfile {
  /** Unique customer profile identifier. */
  id: string;
  /** Unique user identifier. */
  userId: string;
  /** Associated workspace identifier. */
  workspaceId: string;
  /** Optional company name. */
  company?: string | null;
  /** Optional job title. */
  jobTitle?: string | null;
  /** External CRM identifier. */
  crmId?: string | null;
  /** Custom metadata key-value store. */
  metadata?: Record<string, unknown> | null;
  /** Array of customer tags. */
  tags?: string[];
  /** Associated user profile details. */
  user?: UserProfile;
}

/**
 * Represents a support ticket.
 */
export interface SupportTicket {
  /** Unique ticket identifier. */
  id: string;
  /** Subject line or title of the ticket. */
  subject: string;
  /** Status of the ticket (OPEN, IN_PROGRESS, RESOLVED, CLOSED). */
  status: string;
  /** Unique workspace identifier. */
  workspaceId: string;
  /** Unique customer profile identifier. */
  customerId: string;
  /** Unique channel identifier created for ticket messages. */
  channelId?: string | null;
  /** Optional assigned agent user identifier. */
  assigneeId?: string | null;
  /** ISO timestamp when the ticket was created. */
  createdAt: string;
  /** ISO timestamp when the last message was sent. */
  lastMessageAt: string;
  /** Optional customer details. */
  customer?: {
    id: string;
    userId: string;
    user?: UserProfile;
  };
  /** Optional assignee details. */
  assignee?: UserProfile;
  /** Associated channel details. */
  channel?: WorkspaceChannel;
}

/**
 * Represents an active or ended live chat session.
 */
export interface LiveChatSession {
  /** Unique session identifier. */
  id: string;
  /** Associated workspace identifier. */
  workspaceId: string;
  /** Optional customer profile identifier. */
  customerId?: string | null;
  /** Unique channel identifier for live chat. */
  channelId: string;
  /** Session status (ACTIVE, ENDED). */
  status: string;
  /** Custom metadata key-value store. */
  metadata?: Record<string, unknown> | null;
  /** Associated support ticket identifier if escalated. */
  ticketId?: string | null;
  /** ISO timestamp when live chat started. */
  createdAt: string;
  /** ISO timestamp when live chat ended. */
  endedAt?: string | null;
  /** Associated live chat channel details. */
  channel?: WorkspaceChannel;
}

/**
 * Options for creating a new support ticket.
 */
export interface CreateSupportTicketDto {
  /** Unique workspace identifier where ticket is filed. */
  workspaceId: string;
  /** Subject or title of the support ticket. */
  subject: string;
  /** Initial message content to start the ticket conversation. */
  initialMessage?: string;
}

/**
 * Options for updating support ticket status.
 */
export interface UpdateSupportTicketStatusDto {
  /** Target status (OPEN, IN_PROGRESS, RESOLVED, CLOSED). */
  status: string;
}

/**
 * Options for assigning or unassigning an agent to a support ticket.
 */
export interface AssignSupportTicketDto {
  /** User ID of the agent to assign, or null to unassign. */
  assigneeId: string | null;
}

/**
 * Options for starting a new live chat session.
 */
export interface StartLiveChatDto {
  /** Unique workspace identifier where live chat is initialized. */
  workspaceId: string;
  /** Optional metadata associated with the live chat session. */
  metadata?: Record<string, unknown>;
}

/**
 * Options for creating or updating a customer profile.
 */
export interface CreateCustomerProfileDto {
  /** Associated workspace identifier. */
  workspaceId: string;
  /** User ID of the customer. */
  userId: string;
  /** Optional company name. */
  company?: string;
  /** Optional job title. */
  jobTitle?: string;
  /** External CRM identifier. */
  crmId?: string;
  /** Additional metadata key-value pairs. */
  metadata?: Record<string, unknown>;
  /** Tags for segmenting customers. */
  tags?: string[];
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
    url = url.replace(/\/$/, '');
    if (url.endsWith('/api')) {
      url = url.slice(0, -4);
    }
    this.baseURL = url;
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
  private async getRequestConfig(): Promise<AxiosRequestConfig> {
    const token = await this.getOrFetchToken();
    return {
      baseURL: this.baseURL,
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
          return async (...args: unknown[]) => {
            const config = await this.getRequestConfig();
            const arity = originalMethod.length;

            // Strip trailing undefined values to accurately check user-provided parameters
            const cleanArgs = [...args];
            while (cleanArgs.length > 0 && cleanArgs[cleanArgs.length - 1] === undefined) {
              cleanArgs.pop();
            }

            const lastArg = cleanArgs.length > 0 ? cleanArgs[cleanArgs.length - 1] : undefined;
            const isLastArgOptions =
              cleanArgs.length === arity &&
              typeof lastArg === 'object' &&
              lastArg !== null;

            if (isLastArgOptions) {
              const userOptions = lastArg as AxiosRequestConfig;
              cleanArgs[cleanArgs.length - 1] = {
                ...userOptions,
                baseURL: config.baseURL,
                headers: {
                  ...config.headers,
                  ...userOptions.headers,
                },
              };
            } else {
              while (cleanArgs.length < arity - 1) {
                cleanArgs.push(undefined);
              }
              cleanArgs.push(config);
            }

            return (originalMethod as (...a: unknown[]) => unknown)(...cleanArgs);
          };
        }
        return originalMethod;
      },
    }) as unknown as ReturnType<typeof getSkyrmeChatAPI>;
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
        return this.raw.v3WorkspacesControllerGetWorkspaces(options) as unknown as V3WorkspacesResponse;
      },
      /**
       * Retrieves detailed information of a specific workspace by its slug.
       * @param slug The unique workspace slug identifier.
       * @param options Optional request config override.
       * @returns Workspace details returned exactly from the endpoint.
       */
      get: async (slug: string, options?: AxiosRequestConfig): Promise<V3WorkspaceResponse> => {
        return this.raw.v3WorkspacesControllerGetWorkspaceBySlug(slug, options) as unknown as V3WorkspaceResponse;
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
        return this.raw.v3WorkspacesControllerProvisionWorkspace(data, options) as unknown as V3ProvisionWorkspaceResponse;
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
        return this.raw.v3WorkspacesControllerUpdateWorkspace(slug, data, options) as unknown as V3WorkspaceResponse;
      },
      /**
       * Permanently deletes a specific workspace by its slug.
       * @param slug The unique workspace slug identifier.
       * @param options Optional request config override.
       * @returns Deletion status response exactly from the endpoint.
       */
      delete: async (slug: string, options?: AxiosRequestConfig): Promise<V3DeleteWorkspaceResponse> => {
        return this.raw.v3WorkspacesControllerDeleteWorkspace(slug, options) as unknown as V3DeleteWorkspaceResponse;
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
          return this.raw.v3WorkspacesControllerGetWorkspaceMembers(slug, options) as unknown as V3WorkspaceMembersResponse;
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
          return this.raw.v3WorkspacesControllerAddWorkspaceMember(slug, data, options) as unknown as V3AddWorkspaceMemberResponse;
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
          return this.raw.v3WorkspacesControllerGetWorkspaceMember(slug, memberId, options) as unknown as V3GetWorkspaceMemberResponse;
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
          return this.raw.v3WorkspacesControllerUpdateWorkspaceMember(slug, memberId, data, options) as unknown as V3UpdateWorkspaceMemberResponse;
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
          return this.raw.v3WorkspacesControllerDeleteWorkspaceMember(slug, memberId, options) as unknown as V3DeleteWorkspaceMemberResponse;
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
          return this.raw.channelsControllerGetWorkspaceChannels(slug, options) as unknown as WorkspaceChannel[];
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
          return this.raw.channelsControllerCreateChannel(slug, data, options) as unknown as WorkspaceChannel;
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
        return this.raw.channelsControllerGetChannel(slug, channelId, options) as unknown as WorkspaceChannel;
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
        return this.raw.channelsControllerUpdateChannel(slug, channelId, data, options) as unknown as WorkspaceChannel;
      },
      /**
       * Permanently deletes a channel from a workspace.
       * @param slug The unique workspace slug identifier.
       * @param channelId Unique identifier of the channel to delete.
       * @param options Optional request config override.
       * @returns Success status indicating that the channel was deleted exactly from the endpoint.
       */
      delete: async (slug: string, channelId: string, options?: AxiosRequestConfig): Promise<{ success: boolean }> => {
        return this.raw.channelsControllerDeleteChannel(slug, channelId, options) as unknown as { success: boolean };
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
          return this.raw.channelsControllerGetMessages(channelId, params, options) as unknown as { messages: ChannelMessage[]; nextCursor?: string };
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
          }) as unknown as ChannelMessage;
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
          return this.raw.channelsControllerUpdateMessage(channelId, messageId, data, options) as unknown as ChannelMessage;
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
          return this.raw.channelsControllerDeleteMessage(channelId, messageId, options) as unknown as { success: boolean };
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
        ): Promise<ChannelsControllerAddReactionResult> => {
          return this.raw.channelsControllerAddReaction(channelId, messageId, data, options) as unknown as ChannelsControllerAddReactionResult;
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
        ): Promise<ChannelsControllerRemoveReactionResult> => {
          return this.raw.channelsControllerRemoveReaction(channelId, messageId, emoji, options) as unknown as ChannelsControllerRemoveReactionResult;
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
          return this.raw.dmsControllerUpdateMessage(channelId, messageId, data as UpdateDmMessageDto, options) as unknown as ChannelMessage;
        }
        return this.raw.channelsControllerUpdateMessage(channelId, messageId, data as ChannelsControllerUpdateMessageBody, options) as unknown as ChannelMessage;
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
          return this.raw.dmsControllerDeleteMessage(channelId, messageId, options) as unknown as { success: boolean };
        }
        return this.raw.channelsControllerDeleteMessage(channelId, messageId, options) as unknown as { success: boolean };
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
        data: ChannelsControllerAddReactionBody | DmsControllerAddReactionBody,
        options?: AxiosRequestConfig
      ): Promise<ChannelsControllerAddReactionResult | DmsControllerAddReactionResult> => {
        if (channelId.startsWith('dm-')) {
          return this.raw.dmsControllerAddReaction(channelId, messageId, data as DmsControllerAddReactionBody, options) as unknown as DmsControllerAddReactionResult;
        }
        return this.raw.channelsControllerAddReaction(channelId, messageId, data as ChannelsControllerAddReactionBody, options) as unknown as ChannelsControllerAddReactionResult;
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
      ): Promise<ChannelsControllerRemoveReactionResult | DmsControllerRemoveReactionResult> => {
        if (channelId.startsWith('dm-')) {
          return this.raw.dmsControllerRemoveReaction(channelId, messageId, emoji, options) as unknown as DmsControllerRemoveReactionResult;
        }
        return this.raw.channelsControllerRemoveReaction(channelId, messageId, emoji, options) as unknown as ChannelsControllerRemoveReactionResult;
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
        return this.raw.dmsControllerGetDms(options) as unknown as DmConversation[];
      },
      /**
       * Creates/initiates a direct message conversation with specified users.
       * @param data Create direct message details containing target participant IDs.
       * @param options Optional request config override.
       * @returns Details of the created DM conversation exactly from the endpoint.
       */
      create: async (data: CreateDmDto, options?: AxiosRequestConfig): Promise<DmConversation> => {
        return this.raw.dmsControllerCreateDm(data, options) as unknown as DmConversation;
      },
      /**
       * Retrieves details of a specific direct message conversation.
       * @param dmId Unique identifier of the direct message conversation.
       * @param options Optional request config override.
       * @returns Detailed direct message conversation object exactly from the endpoint.
       */
      get: async (dmId: string, options?: AxiosRequestConfig): Promise<DmConversation> => {
        return this.raw.dmsControllerGetDm(dmId, options) as unknown as DmConversation;
      },
      /**
       * Deletes/closes an active direct message conversation.
       * @param dmId Unique identifier of the direct message conversation to close.
       * @param options Optional request config override.
       * @returns Success status indicating that the DM conversation was deleted exactly from the endpoint.
       */
      delete: async (dmId: string, options?: AxiosRequestConfig): Promise<{ success: boolean }> => {
        return this.raw.dmsControllerDeleteDm(dmId, options) as unknown as { success: boolean };
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
          return this.raw.dmsControllerGetMessages(dmId, params, options) as unknown as { messages: ChannelMessage[]; nextCursor?: string };
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
          }) as unknown as ChannelMessage;
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
          return this.raw.dmsControllerUpdateMessage(dmId, messageId, data, options) as unknown as ChannelMessage;
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
          return this.raw.dmsControllerDeleteMessage(dmId, messageId, options) as unknown as { success: boolean };
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
          data: DmsControllerAddReactionBody,
          options?: AxiosRequestConfig
        ): Promise<DmsControllerAddReactionResult> => {
          return this.raw.dmsControllerAddReaction(dmId, messageId, data, options) as unknown as DmsControllerAddReactionResult;
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
        ): Promise<DmsControllerRemoveReactionResult> => {
          return this.raw.dmsControllerRemoveReaction(dmId, messageId, emoji, options) as unknown as DmsControllerRemoveReactionResult;
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
        return this.raw.usersControllerGetMe(options) as unknown as UserProfile;
      },
      /**
       * Retrieves the public profile of a user by their user ID.
       * @param userId Unique identifier of the target user.
       * @param options Optional request config override.
       * @returns Public user profile returned exactly from the endpoint.
       */
      get: async (userId: string, options?: AxiosRequestConfig): Promise<UserProfile> => {
        return this.raw.usersControllerGetUser(userId, options) as unknown as UserProfile;
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
        return this.raw.usersControllerSearchUsers(params, options) as unknown as UserProfile[];
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
      list: async (slug: string, options?: AxiosRequestConfig): Promise<V3WebhooksControllerGetWebhooksResult> => {
        return this.raw.v3WebhooksControllerGetWebhooks(slug, options) as unknown as V3WebhooksControllerGetWebhooksResult;
      },
      /**
       * Creates a new standard webhook for a workspace. Requires webhooks:write scope.
       * @param slug The unique workspace slug.
       * @param data Configuration options for the standard webhook.
       * @param options Optional request config override.
       */
      create: async (slug: string, data: V3CreateWebhookDto, options?: AxiosRequestConfig): Promise<V3WebhooksControllerCreateWebhookResult> => {
        return this.raw.v3WebhooksControllerCreateWebhook(slug, data, options) as unknown as V3WebhooksControllerCreateWebhookResult;
      },
      /**
       * Retrieves details of a specific webhook. Requires webhooks:read scope.
       * @param slug The unique workspace slug.
       * @param webhookId The unique webhook identifier.
       * @param options Optional request config override.
       */
      get: async (slug: string, webhookId: string, options?: AxiosRequestConfig): Promise<V3WebhooksControllerGetWebhookResult> => {
        return this.raw.v3WebhooksControllerGetWebhook(slug, webhookId, options) as unknown as V3WebhooksControllerGetWebhookResult;
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
      ): Promise<V3WebhooksControllerUpdateWebhookResult> => {
        return this.raw.v3WebhooksControllerUpdateWebhook(slug, webhookId, data, options) as unknown as V3WebhooksControllerUpdateWebhookResult;
      },
      /**
       * Permanently deletes a standard webhook. Requires webhooks:write scope.
       * @param slug The unique workspace slug.
       * @param webhookId The unique webhook identifier.
       * @param options Optional request config override.
       */
      delete: async (slug: string, webhookId: string, options?: AxiosRequestConfig): Promise<V3WebhooksControllerDeleteWebhookResult> => {
        return this.raw.v3WebhooksControllerDeleteWebhook(slug, webhookId, options) as unknown as V3WebhooksControllerDeleteWebhookResult;
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
        list: async (slug: string, channelId: string, options?: AxiosRequestConfig): Promise<V3ChannelIncomingWebhooksControllerGetChannelWebhooksResult> => {
          return this.raw.v3ChannelIncomingWebhooksControllerGetChannelWebhooks(slug, channelId, options) as unknown as V3ChannelIncomingWebhooksControllerGetChannelWebhooksResult;
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
        ): Promise<V3ChannelIncomingWebhooksControllerCreateChannelWebhookResult> => {
          return this.raw.v3ChannelIncomingWebhooksControllerCreateChannelWebhook(slug, channelId, data, options) as unknown as V3ChannelIncomingWebhooksControllerCreateChannelWebhookResult;
        },
        /**
         * Retrieves details of a specific channel incoming webhook. Requires webhooks:read scope.
         * @param slug The unique workspace slug.
         * @param channelId The unique channel identifier.
         * @param webhookId The unique webhook identifier.
         * @param options Optional request config override.
         */
        get: async (slug: string, channelId: string, webhookId: string, options?: AxiosRequestConfig): Promise<V3ChannelIncomingWebhooksControllerGetChannelWebhookResult> => {
          return this.raw.v3ChannelIncomingWebhooksControllerGetChannelWebhook(slug, channelId, webhookId, options) as unknown as V3ChannelIncomingWebhooksControllerGetChannelWebhookResult;
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
        ): Promise<V3ChannelIncomingWebhooksControllerUpdateChannelWebhookResult> => {
          return this.raw.v3ChannelIncomingWebhooksControllerUpdateChannelWebhook(
            slug,
            channelId,
            webhookId,
            data,
            options
          ) as unknown as V3ChannelIncomingWebhooksControllerUpdateChannelWebhookResult;
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
        ): Promise<V3ChannelIncomingWebhooksControllerDeleteChannelWebhookResult> => {
          return this.raw.v3ChannelIncomingWebhooksControllerDeleteChannelWebhook(slug, channelId, webhookId, options) as unknown as V3ChannelIncomingWebhooksControllerDeleteChannelWebhookResult;
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
        ): Promise<V3ChannelIncomingWebhooksControllerExecuteWebhookByUrlTokenResult> => {
          return this.raw.v3ChannelIncomingWebhooksControllerExecuteWebhookByUrlToken(token, data, options) as unknown as V3ChannelIncomingWebhooksControllerExecuteWebhookByUrlTokenResult;
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
        ): Promise<V3ChannelIncomingWebhooksControllerExecuteWebhookByChannelIdResult> => {
          return this.raw.v3ChannelIncomingWebhooksControllerExecuteWebhookByChannelId(
            channelId,
            data,
            params,
            options
          ) as unknown as V3ChannelIncomingWebhooksControllerExecuteWebhookByChannelIdResult;
        },
      },
    };
  }

  /**
   * Operations for managing support tickets, live chat sessions, and customer profiles.
   */
  public get support() {
    return {
      /**
       * Creates a new support ticket in a workspace.
       * @param data Details for creating the ticket including workspaceId, subject, and optional initialMessage.
       * @param options Optional request config override.
       */
      createTicket: async (
        data: CreateSupportTicketDto,
        options?: AxiosRequestConfig
      ): Promise<SupportTicket> => {
        return this.raw.supportControllerCreateTicket({
          ...options,
          data,
        } as any) as unknown as SupportTicket;
      },

      /**
       * Retrieves all support tickets for a given workspace.
       * @param workspaceId Unique workspace identifier.
       * @param options Optional request config override.
       */
      getTickets: async (
        workspaceId: string,
        options?: AxiosRequestConfig
      ): Promise<SupportTicket[]> => {
        return this.raw.supportControllerGetTickets(
          { workspaceId },
          options
        ) as unknown as SupportTicket[];
      },

      /**
       * Updates the status of an existing support ticket.
       * @param ticketId Unique identifier of the support ticket.
       * @param status New status string (e.g. OPEN, IN_PROGRESS, RESOLVED, CLOSED).
       * @param options Optional request config override.
       */
      updateStatus: async (
        ticketId: string,
        status: string,
        options?: AxiosRequestConfig
      ): Promise<SupportTicket> => {
        return this.raw.supportControllerUpdateTicketStatus(ticketId, {
          ...options,
          data: { status },
        } as any) as unknown as SupportTicket;
      },

      /**
       * Assigns a support ticket to an agent or unassigns it.
       * @param ticketId Unique identifier of the support ticket.
       * @param assigneeId User ID of the assigned agent or null to unassign.
       * @param options Optional request config override.
       */
      assignTicket: async (
        ticketId: string,
        assigneeId: string | null,
        options?: AxiosRequestConfig
      ): Promise<SupportTicket> => {
        return this.raw.supportControllerAssignTicket(ticketId, {
          ...options,
          data: { assigneeId },
        } as any) as unknown as SupportTicket;
      },

      /**
       * Sub-namespace for managing support tickets.
       */
      tickets: {
        /**
         * Creates a new support ticket in a workspace.
         * @param data Details for creating the ticket.
         * @param options Optional request config override.
         */
        create: async (
          data: CreateSupportTicketDto,
          options?: AxiosRequestConfig
        ): Promise<SupportTicket> => {
          return this.support.createTicket(data, options);
        },
        /**
         * Lists all support tickets in a workspace.
         * @param workspaceId Unique workspace identifier.
         * @param options Optional request config override.
         */
        list: async (
          workspaceId: string,
          options?: AxiosRequestConfig
        ): Promise<SupportTicket[]> => {
          return this.support.getTickets(workspaceId, options);
        },
        /**
         * Updates ticket status.
         * @param ticketId Unique ticket identifier.
         * @param status New status string.
         * @param options Optional request config override.
         */
        updateStatus: async (
          ticketId: string,
          status: string,
          options?: AxiosRequestConfig
        ): Promise<SupportTicket> => {
          return this.support.updateStatus(ticketId, status, options);
        },
        /**
         * Assigns or unassigns an agent to/from a support ticket.
         * @param ticketId Unique ticket identifier.
         * @param assigneeId Agent user ID or null.
         * @param options Optional request config override.
         */
        assign: async (
          ticketId: string,
          assigneeId: string | null,
          options?: AxiosRequestConfig
        ): Promise<SupportTicket> => {
          return this.support.assignTicket(ticketId, assigneeId, options);
        },
      },

      /**
       * Sub-namespace for live chat sessions.
       */
      liveChat: {
        /**
         * Starts a new live chat session for support.
         * @param data Details for starting live chat session.
         * @param options Optional request config override.
         */
        start: async (
          data: StartLiveChatDto,
          options?: AxiosRequestConfig
        ): Promise<LiveChatSession> => {
          return this.raw.supportControllerStartLiveChat({
            ...options,
            data,
          } as any) as unknown as LiveChatSession;
        },
        /**
         * Ends an active live chat session.
         * @param sessionId Unique session identifier.
         * @param options Optional request config override.
         */
        end: async (
          sessionId: string,
          options?: AxiosRequestConfig
        ): Promise<LiveChatSession> => {
          return this.raw.supportControllerEndLiveChat(sessionId, options) as unknown as LiveChatSession;
        },
      },

      /**
       * Sub-namespace for managing customer profiles.
       */
      customer: {
        /**
         * Creates or updates a customer profile in a workspace.
         * @param data Profile details including workspaceId and userId.
         * @param options Optional request config override.
         */
        createProfile: async (
          data: CreateCustomerProfileDto,
          options?: AxiosRequestConfig
        ): Promise<CustomerProfile> => {
          return this.raw.supportControllerCreateCustomerProfile({
            ...options,
            data,
          } as any) as unknown as CustomerProfile;
        },
        /**
         * Retrieves customer profiles in a workspace.
         * @param workspaceId Unique workspace identifier.
         * @param options Optional request config override.
         */
        getProfiles: async (
          workspaceId: string,
          options?: AxiosRequestConfig
        ): Promise<CustomerProfile[]> => {
          return this.raw.supportControllerGetCustomerProfiles(
            { workspaceId },
            options
          ) as unknown as CustomerProfile[];
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
          return this.raw.v3WorkspacesControllerProvisionWorkspace(data, options) as unknown as V3ProvisionWorkspaceResponse;
        },
        /**
         * Retrieves detailed information of a specific workspace by its slug.
         * @param slug The unique workspace slug.
         * @param options Optional request config override.
         */
        get: async (slug: string, options?: AxiosRequestConfig): Promise<V3WorkspaceResponse> => {
          return this.raw.v3WorkspacesControllerGetWorkspaceBySlug(slug, options) as unknown as V3WorkspaceResponse;
        },
        /**
         * Lists all workspaces under the organization context.
         * @param options Optional request config override.
         */
        list: async (options?: AxiosRequestConfig): Promise<V3WorkspacesResponse> => {
          return this.raw.v3WorkspacesControllerGetWorkspaces(options) as unknown as V3WorkspacesResponse;
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
          return this.raw.v3WorkspacesControllerUpdateWorkspace(slug, data, options) as unknown as V3WorkspaceResponse;
        },
        /**
         * Permanently deletes a specific workspace by its slug.
         * @param slug The unique workspace slug.
         * @param options Optional request config override.
         */
        delete: async (slug: string, options?: AxiosRequestConfig): Promise<V3DeleteWorkspaceResponse> => {
          return this.raw.v3WorkspacesControllerDeleteWorkspace(slug, options) as unknown as V3DeleteWorkspaceResponse;
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
          return this.raw.v3WorkspacesControllerGetWorkspaceMembers(slug, options) as unknown as V3WorkspaceMembersResponse;
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
          return this.raw.v3WorkspacesControllerAddWorkspaceMember(slug, data, options) as unknown as V3AddWorkspaceMemberResponse;
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
          return this.raw.v3WorkspacesControllerGetWorkspaceMember(slug, memberId, options) as unknown as V3GetWorkspaceMemberResponse;
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
          return this.raw.v3WorkspacesControllerUpdateWorkspaceMember(slug, memberId, data, options) as unknown as V3UpdateWorkspaceMemberResponse;
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
          return this.raw.v3WorkspacesControllerDeleteWorkspaceMember(slug, memberId, options) as unknown as V3DeleteWorkspaceMemberResponse;
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
        token: async (clientId: string, clientSecret: string, options?: AxiosRequestConfig): Promise<V3OAuthControllerGetTokenResult> => {
          return this.raw.v3OAuthControllerGetToken(
            {
              client_id: clientId,
              client_secret: clientSecret,
              grant_type: 'client_credentials',
            },
            options
          ) as unknown as V3OAuthControllerGetTokenResult;
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

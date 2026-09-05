# Machine-to-Machine (M2M) V3 API Integration Guide

Machine-to-Machine (M2M) integration allows your organization's backend systems, internal microservices, and enterprise applications to interact with Scyrme Chat autonomously. This is ideal for provisioning tenants, managing workspace CRUD at scale, configuring webhooks, sync member registries, and orchestrating server-side bot workflows.

---

## Enterprise-Grade Security & Connections

We employ strict, modern security practices to ensure that your integration is perfectly isolated and completely secure against leakages or attacks:

1. **OAuth2 Client Credentials Grant**: Secure authentication using a unique `client_id` and `client_secret`.
2. **Timing-Safe Credential Verification**: All client secret verifications are executed in constant-time using cryptographic hashing to prevent timing attack side-channels.
3. **Robust IP Whitelisting & Normalization**: Restricts API calls to authorized IP addresses. The system automatically normalizes and validates both native IPv4, IPv6, and IPv6-mapped IPv4 (`::ffff:x.x.x.x`) structures.
4. **Tenant Isolation**: Secure context-bound verification checks ensure that an M2M application can only view, update, or manage workspaces belonging strictly to its authorized organization.

---

## Standard V3 Response Format

To simplify client construction, SDK auto-generation, and standard API consuming patterns, all V3 API endpoints conform to a predictable wrapped JSON response model:

```json
{
  "success": true,
  "data": {
    ...
  },
  "timestamp": "2026-07-10T06:25:22.704Z"
}
```

If an error occurs, the standard exception filter returns a clean structure:
```json
{
  "statusCode": 403,
  "timestamp": "2026-07-10T06:25:22.704Z",
  "path": "/api/v3/workspaces/acme",
  "message": "Missing provisioning:workspaces scope"
}
```

---

## The Official TypeScript SDK (`@scryme/chat`)

For standard TypeScript/JavaScript backend or frontend environments, we **highly recommend** using our official `@scryme/chat` SDK instead of executing manual HTTP calls. It automates authentication, client token caching, proactive renewals, and handles all dynamic path substitutions with unmatched type-safety!

### Installation

```bash
npm install @scryme/chat
# or
pnpm add @scryme/chat
# or
yarn add @scryme/chat
```

### Initialization Options

The SDK can be initialized in multiple modes depending on your environment.

```typescript
import { ScrymeSDK } from '@scryme/chat';

// Option A: Machine-to-Machine (M2M) Auth (Highly recommended for servers/bots)
// The SDK automatically exchanges credentials for a Bearer token and handles transparent renewals!
const sdk = new ScrymeSDK({
  baseURL: 'https://api.chat.scryme.tech',
  clientId: 'm2m_client_abc123',
  clientSecret: 'sk_m2m_secret_xyz789',
});

// Option B: Static Bearer/Session Token Auth
const sdkWithToken = new ScrymeSDK({
  baseURL: 'https://api.chat.scryme.tech',
  token: 'oat_your_token_here',
});
```

---

## Complete SDK Namespace Reference

The `ScrymeSDK` class structures its tools under clean, nested namespaces matching standard entities in Skyrme Chat.

---

### 1. Workspaces namespace (`sdk.workspace`)

Comprehensive workspace management and CRUD endpoints with multi-tenant tenant isolation.

```typescript
// 1. List all workspaces belonging to your organization
const workspacesRes = await sdk.workspace.list();
// Returns: V3WorkspacesResponse

// 2. Provision/Create a brand new tenant workspace
const workspace = await sdk.workspace.create({
  name: 'Acme Corporation',
  slug: 'acme-corp',
  ownerEmail: 'admin@acme.com',
  channels: ['general', 'engineering', 'announcements'],
  initialMembers: [
    { email: 'dev@acme.com', role: 'member' }
  ]
});
// Returns: V3ProvisionWorkspaceResponse (Includes generated default System Bot credentials)

// 3. Retrieve detailed metadata of a specific workspace by slug
const details = await sdk.workspace.get('acme-corp');
// Returns: V3WorkspaceResponse

// 4. Update workspace configurations, industry, or branding metadata
const updated = await sdk.workspace.update('acme-corp', {
  name: 'Acme Corporation International',
  description: 'Updated description for the Acme global team.',
});
// Returns: V3WorkspaceResponse

// 5. Permanently delete a workspace by slug
const deleteRes = await sdk.workspace.delete('acme-corp');
// Returns: V3DeleteWorkspaceResponse
```

#### Workspace Members Sub-namespace (`sdk.workspace.members`)

Manage workspace access, invitations, roles, and member listings.

```typescript
// 1. List all members in a workspace
const members = await sdk.workspace.members.list('acme-corp');
// Returns: V3WorkspaceMembersResponse

// 2. Add/Invite a user by email with a specific role
const addRes = await sdk.workspace.members.add('acme-corp', {
  email: 'new-hire@acme.com',
  role: 'member', // Roles: owner | admin | moderator | member | guest
});
// Returns: V3AddWorkspaceMemberResponse

// 3. Get membership details of a specific workspace member
const member = await sdk.workspace.members.get('acme-corp', 'user_id_xyz');
// Returns: V3GetWorkspaceMemberResponse

// 4. Update the role of a workspace member
const updateRes = await sdk.workspace.members.update('acme-corp', 'user_id_xyz', {
  role: 'admin',
});
// Returns: V3UpdateWorkspaceMemberResponse

// 5. Remove a member from the workspace
const deleteRes = await sdk.workspace.members.delete('acme-corp', 'user_id_xyz');
// Returns: V3DeleteWorkspaceMemberResponse
```

#### Workspace Channels Sub-namespace (`sdk.workspace.channels`)

Manage channels inside a workspace.

```typescript
// 1. List all public (and accessible private) channels in a workspace
const channels = await sdk.workspace.channels.list('acme-corp');
// Returns: WorkspaceChannel[]

// 2. Create a new channel in a workspace
const newChannel = await sdk.workspace.channels.create('acme-corp', {
  name: 'security-alerts',
  description: 'Channel for security notification broadcasts',
  type: 'private', // public | private
});
// Returns: WorkspaceChannel
```

---

### 2. Channels namespace (`sdk.channel`)

Direct operations on specific channels and channel message records.

```typescript
// 1. Retrieve metadata for a specific channel
const channel = await sdk.channel.get('acme-corp', 'channel_id_123');
// Returns: WorkspaceChannel

// 2. Update channel details
const updatedChannel = await sdk.channel.update('acme-corp', 'channel_id_123', {
  name: 'security-notifications',
  description: 'Updated security channel description.',
});
// Returns: WorkspaceChannel

// 3. Permanently delete a channel from the workspace
const deleteRes = await sdk.channel.delete('acme-corp', 'channel_id_123');
// Returns: { success: boolean }
```

#### Channel Messages Sub-namespace (`sdk.channel.message`)

Send, query, react to, and moderate messages in channels.

```typescript
// 1. Fetch channel messages with optional pagination cursors and limits
const history = await sdk.channel.message.list('channel_id_123', {
  limit: 20,
  cursor: 'msg_cursor_id_abc',
});
// Returns: { messages: ChannelMessage[]; nextCursor?: string }

// 2. Send a new message to a channel
const msg = await sdk.channel.message.create('channel_id_123', {
  content: 'Hello Security Team! Please review the latest audit logs.',
});
// Returns: ChannelMessage

// 3. Edit the content of a sent message
const updatedMsg = await sdk.channel.message.update('channel_id_123', 'message_id_999', {
  content: 'Corrected message content.',
});
// Returns: ChannelMessage

// 4. Delete a message
const deleteRes = await sdk.channel.message.delete('channel_id_123', 'message_id_999');
// Returns: { success: boolean }

// 5. Add an emoji reaction to a message
const reactionRes = await sdk.channel.message.addReaction('channel_id_123', 'message_id_999', {
  emoji: '🛡️',
});
// Returns: ChannelsControllerAddReactionResult

// 6. Remove a previous emoji reaction from a message
const removeRes = await sdk.channel.message.removeReaction('channel_id_123', 'message_id_999', '🛡️');
// Returns: ChannelsControllerRemoveReactionResult
```

---

### 3. Messages namespace (`sdk.message`)

Symmetric universal messaging actions. This helper space automatically checks if the `channelId` begins with `dm-` and routes the request to the correct channel or direct message backend controllers dynamically.

```typescript
// 1. Update any message (channel or DM)
const msg = await sdk.message.update('channel_or_dm_id', 'message_id', {
  content: 'New content',
});
// Returns: ChannelMessage

// 2. Delete any message
const deleteRes = await sdk.message.delete('channel_or_dm_id', 'message_id');
// Returns: { success: boolean }

// 3. Add a reaction
const reaction = await sdk.message.addReaction('channel_or_dm_id', 'message_id', {
  emoji: '🚀',
});

// 4. Remove a reaction
const removeRes = await sdk.message.removeReaction('channel_or_dm_id', 'message_id', '🚀');
```

---

### 4. Direct Messages namespace (`sdk.dm`)

Full-lifecycle direct messaging conversation orchestrations.

```typescript
// 1. List all active DM conversations for the authenticated user/bot context
const dms = await sdk.dm.list();
// Returns: DmConversation[]

// 2. Start a new DM conversation with another user
const newDm = await sdk.dm.create({
  userId: 'user_id_partner',
});
// Returns: DmConversation

// 3. Retrieve detailed information for a specific DM conversation
const dm = await sdk.dm.get('dm_id_123');
// Returns: DmConversation

// 4. Delete/Close a DM conversation
const deleteRes = await sdk.dm.delete('dm_id_123');
// Returns: { success: boolean }
```

#### DM Messages Sub-namespace (`sdk.dm.message`)

Send and manage messages specifically in DM conversations.

```typescript
// 1. List messages in a DM conversation
const history = await sdk.dm.message.list('dm_id_123', { limit: 15 });
// Returns: { messages: ChannelMessage[]; nextCursor?: string }

// 2. Send a direct message
const msg = await sdk.dm.message.create('dm_id_123', 'Hi there! This is a private notification.');
// Returns: ChannelMessage

// 3. Edit a DM message
const updatedMsg = await sdk.dm.message.update('dm_id_123', 'message_id_456', {
  content: 'Hi there! Here is the updated alert.',
});
// Returns: ChannelMessage

// 4. Delete a DM message
const deleteRes = await sdk.dm.message.delete('dm_id_123', 'message_id_456');
// Returns: { success: boolean }

// 5. React to a DM message
const reaction = await sdk.dm.message.addReaction('dm_id_123', 'message_id_456', {
  emoji: '👍',
});
// Returns: DmsControllerAddReactionResult

// 6. Remove a reaction from a DM message
const removeRes = await sdk.dm.message.removeReaction('dm_id_123', 'message_id_456', '👍');
// Returns: DmsControllerRemoveReactionResult
```

---

### 5. Users namespace (`sdk.user`)

Access current or public user profiles, or query directory indices.

```typescript
// 1. Retrieve the profile details of the currently authenticated identity
const selfProfile = await sdk.user.me();
// Returns: UserProfile

// 2. Retrieve public profile details of any user by ID
const publicProfile = await sdk.user.get('user_id_xyz');
// Returns: UserProfile

// 3. Search user directories using name or username filters
const searchResults = await sdk.user.search({
  query: 'alice',
});
// Returns: UserProfile[]
```

---

### 6. Webhooks namespace (`sdk.webhooks`)

Configure and manage secure real-time outgoing webhooks, or create discord-style channel incoming webhooks.

```typescript
// 1. List all active standard workspace webhooks
const webhooks = await sdk.webhooks.list('acme-corp');
// Returns: V3WebhooksControllerGetWebhooksResult

// 2. Register a new outgoing webhook for workspace events
const newWebhook = await sdk.webhooks.create('acme-corp', {
  name: 'Security Alert Dispatcher',
  url: 'https://security.acme.com/alerts/receiver',
  events: ['message.sent', 'channel.created', 'member.joined'],
  active: true,
});
// Returns: V3WebhooksControllerCreateWebhookResult

// 3. Retrieve details of a specific webhook
const webhook = await sdk.webhooks.get('acme-corp', 'webhook_id_abc');
// Returns: V3WebhooksControllerGetWebhookResult

// 4. Update the events or status of an existing webhook
const updated = await sdk.webhooks.update('acme-corp', 'webhook_id_abc', {
  active: false,
});
// Returns: V3WebhooksControllerUpdateWebhookResult

// 5. Delete a webhook
const deleteRes = await sdk.webhooks.delete('acme-corp', 'webhook_id_abc');
// Returns: V3WebhooksControllerDeleteWebhookResult
```

#### Channel Incoming Webhooks Sub-namespace (`sdk.webhooks.incoming`)

Provision Discord-style Incoming Webhooks targeting specific channels. These allow external services to post messages directly to channels using simple tokens without needing authentication headers.

```typescript
// 1. List all incoming webhooks configured for a specific channel
const incomingWebhooks = await sdk.webhooks.incoming.list('acme-corp', 'channel_id_123');
// Returns: V3ChannelIncomingWebhooksControllerGetChannelWebhooksResult

// 2. Create a new incoming webhook for a channel
const webhook = await sdk.webhooks.incoming.create('acme-corp', 'channel_id_123', {
  name: 'CI/CD Alerts',
  description: 'Posts deployment events from GitHub Actions.',
});
// Returns: V3ChannelIncomingWebhooksControllerCreateChannelWebhookResult

// 3. Get details of a channel incoming webhook
const details = await sdk.webhooks.incoming.get('acme-corp', 'channel_id_123', 'webhook_id_abc');
// Returns: V3ChannelIncomingWebhooksControllerGetChannelWebhookResult

// 4. Update an incoming webhook's name or configuration
const updated = await sdk.webhooks.incoming.update('acme-corp', 'channel_id_123', 'webhook_id_abc', {
  name: 'GitHub Deployment Alerts',
});
// Returns: V3ChannelIncomingWebhooksControllerUpdateChannelWebhookResult

// 5. Delete an incoming webhook
const deleteRes = await sdk.webhooks.incoming.delete('acme-corp', 'channel_id_123', 'webhook_id_abc');
// Returns: V3ChannelIncomingWebhooksControllerDeleteChannelWebhookResult

// 6. Execute an incoming webhook by its unique token in URL path (Does not require Authorization Bearer headers!)
const executeRes1 = await sdk.webhooks.incoming.executeByUrlToken('webhook_token_xyz', {
  content: 'Deployment to production was successful! 🚀',
  username: 'CI Bot',
  avatar_url: 'https://example.com/ci-avatar.png',
});
// Returns: V3ChannelIncomingWebhooksControllerExecuteWebhookByUrlTokenResult

// 7. Execute an incoming webhook by channel ID (Authentication headers required)
const executeRes2 = await sdk.webhooks.incoming.executeByChannelId('channel_id_123', {
  content: 'Internal server alert!',
}, {
  token: 'webhook_token_xyz',
});
// Returns: V3ChannelIncomingWebhooksControllerExecuteWebhookByChannelIdResult
```

---

### 7. Explicit M2M namespace (`sdk.m2m`)

An explicit first-class namespace grouping V3 Enterprise M2M APIs into highly logical spaces for perfect server-side DX.

```typescript
// --- Workspace Provisioning & Lifecycle ---
const listWorkspaces = await sdk.m2m.workspace.list();
const newWorkspace = await sdk.m2m.workspace.provision({
  name: 'Partner Tenant',
  slug: 'partner-tenant',
  ownerEmail: 'tenant-owner@partner.com',
  channels: ['general'],
});
const getWorkspace = await sdk.m2m.workspace.get('partner-tenant');
const updateWorkspace = await sdk.m2m.workspace.update('partner-tenant', {
  name: 'Partner Tenant Global',
});
const deleteWorkspace = await sdk.m2m.workspace.delete('partner-tenant');

// --- Membership Syncing & Admin ---
const workspaceMembers = await sdk.m2m.member.list('partner-tenant');
const addedMember = await sdk.m2m.member.add('partner-tenant', {
  email: 'collaborator@partner.com',
  role: 'member',
});
const getMember = await sdk.m2m.member.get('partner-tenant', 'user_id_xyz');
const updatedMember = await sdk.m2m.member.update('partner-tenant', 'user_id_xyz', {
  role: 'moderator',
});
const removedMember = await sdk.m2m.member.delete('partner-tenant', 'user_id_xyz');

// --- Authentication & Token Exchange Utilities ---
// Manually fetch or exchange credentials for an access token
const tokenData = await sdk.m2m.auth.token('YOUR_CLIENT_ID', 'YOUR_CLIENT_SECRET');
// Returns: V3OAuthControllerGetTokenResult

// Get the current cached token or execute an auto-refresh cycle
const tokenStr = await sdk.m2m.auth.getOrFetchToken();
// Returns: string | null
```

---

## Dynamic Lower-Level Proxying (`sdk.raw`)

If you require low-level control or want to interact directly with any of our 100+ generated V3 controllers and actions (defined via Orval / NestJS), use `sdk.raw`.

`sdk.raw` is a powerful, dynamic JS proxy intercepting all method calls. It automatically:
- Resolves your base URL.
- Intercepts requests to inject or refresh your Bearer token dynamically before transmitting.
- Preserves full autocompletion and TS types for all paths, request bodies, query params, and returns.

```typescript
// Access generated lower-level raw endpoints directly
const health = await sdk.raw.appControllerGetHealth();

// Query users by string with parameters
const results = await sdk.raw.usersControllerSearchUsers({
  query: 'developer',
});

// Explicitly provision a workspace using the raw controller method
const rawRes = await sdk.raw.v3WorkspacesControllerProvisionWorkspace({
  name: 'Demo Space',
  slug: 'demo-space',
  ownerEmail: 'demo@demo.com',
});
```

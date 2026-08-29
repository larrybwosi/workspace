# Scryme Chat TypeScript SDK (`@scryme/chat`)

A high-performance, developer-friendly, fully typed TypeScript/JavaScript SDK for interacting with the Skyrme Chat V2 and V3 Enterprise APIs.

Designed primarily for backend integrations, servers, and automated Machine-to-Machine (M2M) environments, this SDK provides unmatched DX with automatic OAuth2 token management, dynamic API proxying, and fluent nested helper chains.

---

## Features

- **OAuth2 Client Credentials Grant**: Built-in, fully automated caching and renewal of M2M access tokens with timing-safe, proactive expiration buffers.
- **Dynamic Method Proxying (`sdk.raw`)**: Automatic injection of Bearer token and Base URL headers into any of the 100+ generated V3 API endpoints with complete TypeScript autocompletion.
- **Fluent Nested Namespaces**: High-level, developer-friendly helper routes (`sdk.workspace`, `sdk.channel`, `sdk.message`, etc.) for seamless workspace, department, team, and member administration.
- **Isomorphic Support**: Works out-of-the-box in Node.js, Next.js (server/client), Vite, and React Native.

---

## Installation

```bash
npm install @scryme/chat
# or
pnpm add @scryme/chat
# or
yarn add @scryme/chat
```

---

## Getting Started

### 1. Initialize the SDK

You can initialize `ScrymeSDK` using a static bearer token or using M2M client credentials (`clientId` and `clientSecret`) to enable auto-authentication.

```typescript
import { ScrymeSDK } from '@scryme/chat';

// Option A: Machine-to-Machine (M2M) Auth (Highly recommended for servers/bots)
const sdk = new ScrymeSDK({
  baseURL: 'https://api.chat.scryme.tech',
  clientId: 'm2m_client_abc123',
  clientSecret: 'sk_m2m_secret_xyz789',
});

// Option B: Static Bearer Token Auth
const sdkWithToken = new ScrymeSDK({
  baseURL: 'https://api.chat.scryme.tech',
  token: 'oat_your_token_here',
});
```

---

## Usage Guide

### High-Level Fluent Namespaces (Excellent DX)

For standard CRUD workflows, utilize our intuitive nested namespace chains:

#### Workspaces
```typescript
// List all workspaces associated with the organization
const workspaces = await sdk.workspace.list();

// Provision/Create a new tenant workspace
const newWorkspace = await sdk.workspace.create({
  name: 'Acme Corp',
  slug: 'acme-corp',
  ownerEmail: 'admin@acme.com',
  channels: ['general', 'engineering'],
});

// Retrieve detailed workspace metadata
const workspace = await sdk.workspace.get('acme-corp');

// Update workspace branding or details
await sdk.workspace.update('acme-corp', {
  name: 'Acme Corp International',
  description: 'Updated team workspace',
});

// Delete a workspace
await sdk.workspace.delete('acme-corp');
```

#### Workspace Members
```typescript
// List workspace members
const members = await sdk.workspace.members.list('acme-corp');

// Invite/Add a new member
await sdk.workspace.members.add('acme-corp', {
  email: 'developer@acme.com',
  role: 'member',
});

// Remove a member
await sdk.workspace.members.delete('acme-corp', 'member_id_xyz');
```

#### Channels & Messaging
```typescript
// List channels in a workspace
const channels = await sdk.workspace.channels.list('acme-corp');

// Create a new channel with custom visibility, icon, metadata, and initial members
const channel = await sdk.workspace.channels.create('acme-corp', {
  name: 'engineering',
  description: 'Engineering discussion channel',
  type: 'private',
  isPrivate: true,
  icon: 'code',
  metadata: { department: 'eng' },
});

// Update channel settings, visibility, and metadata
await sdk.channel.update('acme-corp', 'channel_id_123', {
  name: 'eng-tech',
  description: 'Updated description',
  icon: 'terminal',
  metadata: { priority: 'high' },
});

// Manage channel member access and permissions
await sdk.channel.members.add('acme-corp', 'channel_id_123', {
  userIds: ['user_456'],
  role: 'moderator',
  permissions: '2048',
});

await sdk.channel.members.update('acme-corp', 'channel_id_123', 'user_456', {
  role: 'admin',
  permissions: '4096',
});

await sdk.channel.members.remove('acme-corp', 'channel_id_123', 'user_456');

// Send a message to a channel
await sdk.channel.message.create('channel_id_123', {
  content: 'Hello Team! This is automated via our new TS SDK 🚀',
});

// Fetch channel messages
const messages = await sdk.channel.message.list('channel_id_123', { limit: 10 });
```

---

### Dynamic API Proxying (`sdk.raw`)

If you need lower-level control or need to access raw Orval/Axios endpoints not wrapped in our helper namespaces, use `sdk.raw`.

Every raw endpoint:
1. Offers **full TypeScript types** for parameters, request body, and response.
2. **Automatically injects** the required Bearer Authorization header (fetching or refreshing the M2M token on the fly).
3. Resolves to the correct configured API Base URL.

```typescript
// Access lower-level generated controller methods directly
const health = await sdk.raw.appControllerGetHealth();

// User search
const users = await sdk.raw.usersControllerSearchUsers({ q: 'alice' });

// Fully typed update workspace webhook call
const webhook = await sdk.raw.v3WebhooksControllerCreateWebhook('acme-corp', {
  name: 'Slack Sync Sync',
  url: 'https://hooks.slack.com/services/...',
  events: ['message.created'],
});
```

---

## Development

### Compile the SDK
```bash
pnpm build
```

### Run Unit Tests
```bash
pnpm test
```

---

## License

MIT © Skyrme Chat Enterprise

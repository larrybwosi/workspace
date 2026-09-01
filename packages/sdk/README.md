# Scryme Chat TypeScript SDK (`@scryme/chat`)

A high-performance, developer-friendly, fully typed TypeScript/JavaScript SDK for interacting with the Scryme Chat V2 and V3 Enterprise APIs.

Designed primarily for backend integrations, servers, and automated Machine-to-Machine (M2M) environments, this SDK provides unmatched DX with automatic OAuth2 token management, dynamic API proxying, custom message builders, and fluent nested helper chains.

---

## Features

- **OAuth2 Client Credentials Grant**: Built-in, fully automated caching and renewal of M2M access tokens with timing-safe, proactive expiration buffers.
- **Dynamic Method Proxying (`sdk.raw`)**: Automatic injection of Bearer token and Base URL headers into any of the generated V3 API endpoints with complete TypeScript autocompletion.
- **Fluent Nested Namespaces**: High-level, developer-friendly helper routes (`sdk.workspace`, `sdk.channel`, `sdk.message`, `sdk.webhooks`, `sdk.bot`) for seamless workspace, department, team, and member administration.
- **Custom Message Builders**: Type-safe helpers (`createCustomMessageSchema`, `createFormCustomMessageSchema`) for generating node-based interactive in-chat forms, surveys, and approval cards.
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

// Send a message to a channel with interactive buttons
await sdk.channel.message.create('channel_id_123', {
  content: 'Please approve the deployment request',
  messageType: 'approval',
  metadata: {
    callbackUrl: 'https://my-app.example.com/api/actions/callback',
  },
  actions: [
    { actionId: 'approve', label: 'Approve', style: 'primary' },
    { actionId: 'reject', label: 'Reject', style: 'danger' }
  ]
});

// Fetch channel messages
const messages = await sdk.channel.message.list('channel_id_123', { limit: 10 });
```

#### Webhooks Management
```typescript
// List workspace webhooks
const webhooks = await sdk.webhooks.list('acme-corp');

// Create outgoing workspace webhook
const newWebhook = await sdk.webhooks.create('acme-corp', {
  name: 'CI Notifier',
  url: 'https://my-app.example.com/api/webhooks',
  events: ['message.sent', 'message.action_response'],
});
```

---

### Custom Message Builders

Use `@scryme/chat` custom message builders to construct rich, interactive forms and surveys to attach to messages:

```typescript
import { createFormCustomMessageSchema } from '@scryme/chat';

const feedbackSchema = createFormCustomMessageSchema({
  title: 'Quarterly Team Feedback',
  description: 'Please submit your thoughts on team performance',
  icon: 'HelpCircle',
  inputs: [
    {
      id: 'rating',
      label: 'Performance Rating (1-5)',
      placeholder: 'Enter 1 to 5',
      required: true,
    },
    {
      id: 'comments',
      label: 'Additional Comments',
      placeholder: 'Optional feedback...',
      multiline: true,
    }
  ],
  submitLabel: 'Send Feedback',
  callbackId: 'team-feedback-submit',
});

// Send the custom form message to a channel
await sdk.channel.message.create('channel_id_123', {
  content: 'New feedback survey',
  messageType: 'custom',
  metadata: feedbackSchema,
});
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
  name: 'Slack Sync',
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

MIT © Scryme Chat Enterprise

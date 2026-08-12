# Getting Started with Scrymechat API

Welcome to the Scrymechat developer documentation. Our API is designed to help you build powerful integrations, bots, and automations that enhance your team's workflow.

## Overview

The Scrymechat API is a RESTful API that uses JSON for requests and responses. It is organized around the V3 specification, focusing on workspace-level interactions and enterprise-grade provisioning.

## Key Concepts

- **Workspaces**: Everything happens inside a workspace. You'll need the workspace `slug` for most API calls.
- **Bots & Applications**: To use the API, you first create a Bot Application in the Scrymechat Developer Portal. This gives you the credentials needed for authentication.
- **M2M Applications**: For enterprise-level automation like workspace provisioning, use Machine-to-Machine (M2M) applications.
- **Scoping**: Our API uses granular scopes (e.g., `messages:send`, `provisioning:workspaces`) so you can grant your apps only the permissions they need.
- **Real-time**: While you use REST to _do_ things, you can use **Webhooks** or connect to our **Ably** integration to _listen_ to things happening in real-time.

---

## Official TypeScript SDK (Recommended)

Instead of manually constructing HTTP requests and managing tokens in TypeScript, you should use our official, high-performance, and fully typed `@scryme/chat` SDK. This is the recommended path for building robust integrations.

### 1. Installation

Install the package using your favorite package manager:

```bash
npm install @scryme/chat
# or
pnpm add @scryme/chat
# or
yarn add @scryme/chat
```

### 2. Initialization

You can initialize the `ScrymeSDK` using either Machine-to-Machine (M2M) Client Credentials (ideal for backend services/bots) or a static Bearer Token (ideal for personal scripts or web clients).

#### Option A: M2M Client Credentials (Automatic Auth)
The SDK will automatically handle fetching, caching, and proactively renewing your OAuth2 Bearer token!

```typescript
import { ScrymeSDK } from '@scryme/chat';

const sdk = new ScrymeSDK({
  baseURL: 'https://api.chat.scryme.tech',
  clientId: 'YOUR_CLIENT_ID',
  clientSecret: 'YOUR_CLIENT_SECRET',
});
```

#### Option B: Static Bearer Token
If you already have a token (like a Workspace Token `wst_` or a pre-exchanged OAuth token `oat_`), you can pass it directly:

```typescript
import { ScrymeSDK } from '@scryme/chat';

const sdk = new ScrymeSDK({
  baseURL: 'https://api.chat.scryme.tech',
  token: 'YOUR_STATIC_TOKEN',
});
```

### 3. Usage Example

Here is how simple it is to list channels and send a message using the SDK:

```typescript
import { ScrymeSDK } from '@scryme/chat';

const sdk = new ScrymeSDK({
  baseURL: 'https://api.chat.scryme.tech',
  clientId: 'YOUR_CLIENT_ID',
  clientSecret: 'YOUR_CLIENT_SECRET',
});

async function run() {
  const workspaceSlug = 'my-workspace';

  // 1. List channels inside a workspace
  const channels = await sdk.workspace.channels.list(workspaceSlug);
  console.log(`Found ${channels.length} channels.`);

  const generalChannel = channels.find(c => c.name === 'general');
  if (generalChannel) {
    // 2. Send a message to the general channel
    const message = await sdk.channel.message.create(generalChannel.id, {
      content: 'Hello World! Powered by the official @scryme/chat SDK 🚀',
    });
    console.log(`Sent message with ID: ${message.id}`);
  }
}

run().catch(console.error);
```

---

## Quick Start (Raw HTTP/cURL)

If you are not using TypeScript/JavaScript, you can interact with the API using raw HTTP requests.

1. **Create an App**: Go to Workspace Settings > Developer Portal and create a new Bot Application.
   - Give your application a name and description.
   - Choose whether it's a **Workspace App** (only for your workspace) or a **Public App** (can be installed by other workspaces).
2. **Get Credentials**: Copy your `Client ID` and `Client Secret` from the app details page.
3. **Authenticate**: Exchange your credentials for an access token.
   ```bash
   curl -X POST https://api.chat.scryme.tech/v3/oauth/token \
     -d '{"grant_type":"client_credentials","client_id":"...","client_secret":"..."}'
   ```
4. **Make your first call**: List the channels in your workspace.
   ```bash
   curl https://api.chat.scryme.tech/v3/workspaces/my-workspace/channels \
     -H "Authorization: Bearer <your_token>"
   ```

## Base URL

All API requests should be made to:
`https://api.chat.scryme.tech`

---

Next: [Learn about Authentication](/api-reference/authentication)

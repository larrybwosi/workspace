# Message Actions & Dynamic Interactions Guide

Message Actions enable interactive workflows directly within chat conversations. Integrating systems (such as HR tools, CI/CD pipelines, approval bots, and CRM automation) can attach interactive buttons to messages and process real-time user responses.

This guide details how to configure message actions, handle single-use vs multi-use modes, support direct message (DM) actions, set up dynamic bot interactions endpoints, and process incoming events.

---

## 1. Overview & Core Features

- **Interactive UI Components**: Attach primary, secondary, destructive, or ghost action buttons to standard or custom messages.
- **Single-use vs Multi-use Actions**:
  - `allowMultipleResponses: false` (Default): Once a user responds to an action button, it is disabled for that user in the UI and subsequent API responses are rejected with `400 Bad Request`.
  - `allowMultipleResponses: true`: Users can submit form state or trigger the action multiple times (ideal for surveys or counter triggers).
- **Channels & Direct Messages (DMs)**: Message actions operate seamlessly across workspace channels (`/v3/workspaces/:slug/channels/...`) and direct messages (`/v3/dms/:dmId/...`).
- **Dynamic Interactions Fallback**: When posting messages from bot apps, if no explicit `callbackUrl` is passed on the message, callbacks are automatically routed to the registered OAuth Application `interactionsUrl`.

---

## 2. Configuration & Attachment Options

### Adding Actions via V3 API

When creating or posting custom messages via `POST /v3/workspaces/:slug/channels/:channelId/messages/custom` or `POST /v3/dms/:dmId/messages`, attach an `actions` array or include actions inside `customMessage`:

```json
{
  "content": "Deployment Approval Request #1024",
  "customMessage": {
    "version": "v1",
    "type": "APPROVAL",
    "context": {
      "title": "Production Deployment #1024",
      "description": "Triggered by GitHub Actions",
      "priority": "urgent"
    },
    "root": {
      "type": "Layout.Card",
      "children": [
        {
          "type": "Display.Field",
          "properties": { "label": "Service", "value": "api-server" }
        }
      ]
    },
    "actions": [
      {
        "id": "approve",
        "label": "Approve",
        "type": "PRIMARY",
        "icon": "Check",
        "allowMultipleResponses": false,
        "handler": {
          "type": "CALLBACK",
          "callbackId": "deploy-1024",
          "payload": { "environment": "production" }
        }
      },
      {
        "id": "reject",
        "label": "Reject",
        "type": "DESTRUCTIVE",
        "icon": "X",
        "allowMultipleResponses": false,
        "handler": {
          "type": "CALLBACK",
          "callbackId": "deploy-1024"
        }
      }
    ],
    "metadata": {
      "callbackUrl": "https://api.acme.com/v1/chat-callbacks"
    }
  }
}
```

---

## 3. Bot Application `interactionsUrl` Configuration

For M2M bot integrations registered under `POST /v3/applications`, configure `interactionsUrl` during app registration or update:

```json
{
  "name": "Acme Deployment Bot",
  "description": "Automates CI/CD deployment approvals",
  "interactionsUrl": "https://bot.acme.com/api/interactions"
}
```

When this bot posts an interactive message without specifying an explicit `metadata.callbackUrl`, the platform automatically dispatches all user action responses to `https://bot.acme.com/api/interactions`.

---

## 4. Triggering Actions via API

Client applications and automated test suites can trigger actions programmatically:

### Channel Message Action Trigger
**Endpoint:** `POST /v3/workspaces/:slug/channels/:channelId/messages/:messageId/actions`
**Or:** `POST /v3/workspaces/:slug/channels/:channelId/messages/:messageId/actions/:actionId`

### Direct Message Action Trigger
**Endpoint:** `POST /v3/dms/:dmId/messages/:messageId/actions`
**Or:** `POST /v3/dms/:dmId/messages/:messageId/actions/:actionId`

**Request Payload:**
```json
{
  "actionId": "approve",
  "comment": "Verified staging builds, proceeding to production.",
  "metadata": {
    "formState": {
      "approverNote": "All tests passed"
    }
  }
}
```

---

## 5. Receiving Event Callbacks in External Systems

When an action button is triggered by a user, the system delivers the event via **Callback Webhooks**, **Workspace Webhooks**, and **Real-time Channels**.

### Webhook Delivery Payload Format

Your webhook endpoint (`callbackUrl` or `interactionsUrl`) receives an HTTP `POST` request with JSON body:

```json
{
  "event": "message.action_response",
  "timestamp": "2026-09-01T12:00:00.000Z",
  "workspace": {
    "id": "ws_12345",
    "name": "Acme Corp",
    "slug": "acme"
  },
  "message": {
    "id": "msg_998877",
    "content": "Deployment Approval Request #1024",
    "channelId": "chan_554433"
  },
  "action": {
    "id": "approve",
    "label": "Approve"
  },
  "response": {
    "id": "resp_001122",
    "userId": "usr_778899",
    "userName": "Jane Doe",
    "userEmail": "jane@acme.com",
    "actionValue": "approve",
    "comment": "Verified staging builds, proceeding to production.",
    "metadata": {
      "environment": "production",
      "formState": { "approverNote": "All tests passed" }
    },
    "respondedAt": "2026-09-01T12:00:00.000Z"
  }
}
```

### HMAC SHA-256 Signature Verification

Callback requests contain the signature header:
`X-Webhook-Signature: sha256=<hex_digest>`
`X-Webhook-Event: message.action_response`

#### Node.js / Express Signature Verification Example

```typescript
import crypto from 'crypto';
import express from 'express';

const app = express();
app.use(express.json());

app.post('/api/interactions', (req, res) => {
  const signatureHeader = req.headers['x-webhook-signature'] as string;
  const secret = process.env.WEBHOOK_SECRET || 'default_secret';

  const expectedSignature = `sha256=${crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(req.body))
    .digest('hex')}`;

  if (signatureHeader !== expectedSignature) {
    return res.status(401).send('Invalid webhook signature');
  }

  const { action, response, message } = req.body;
  console.log(`User ${response.userName} clicked ${action.id} on message ${message.id}`);

  // Process business logic (e.g., trigger CI/CD pipeline)
  return res.status(200).json({ received: true });
});
```

---

## 6. Retrieving Action Responses via REST

You can query all recorded responses for a message at any time:

- **Channel Message Responses:** `GET /v3/workspaces/:slug/channels/:channelId/messages/:messageId/actions`
- **DM Message Responses:** `GET /v3/dms/:dmId/messages/:messageId/actions`

**Response Example:**
```json
{
  "success": true,
  "responses": [
    {
      "id": "resp_001122",
      "actionId": "act_approve",
      "messageId": "msg_998877",
      "userId": "usr_778899",
      "actionValue": "approve",
      "comment": "Verified staging builds",
      "respondedAt": "2026-09-01T12:00:00.000Z",
      "user": {
        "id": "usr_778899",
        "name": "Jane Doe",
        "email": "jane@acme.com",
        "avatar": null
      }
    }
  ]
}
```

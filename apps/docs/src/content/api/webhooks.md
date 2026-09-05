# Webhooks (Enterprise V3)

Webhooks allow your application to send messages into Scrymechat (Incoming Webhooks) and receive real-time notifications about workspace events (Outgoing Webhooks). The Scrymechat V3 API provides a high-performance, Redis-cached webhooks interface designed for massive enterprise volume.

---

## Overview

- **Incoming Webhooks**: Post messages and file attachments directly to channels from external systems (such as GitHub, CI/CD pipelines, or monitoring alerts) without full user authentication.
- **Outgoing Webhooks**: Receive real-time HTTP POST notifications at your specified endpoint when events occur within your workspace (e.g., `message.sent`, `channel.created`, `member.added`).

---

## 1. Incoming Webhooks (Channel Integration)

Incoming webhooks provide a secure token-based URL to post messages directly to specific workspace channels.

### Create Channel Incoming Webhook

**Endpoint:** `POST /v3/workspaces/:slug/channels/:channelId/incoming-webhooks`

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Deployment Bot",
  "description": "Posts production build status alerts"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "webhook": {
      "id": "cwh_12345",
      "channelId": "ch_general",
      "name": "Deployment Bot",
      "description": "Posts production build status alerts",
      "token": "a1b2c3d4e5f6...",
      "secret": "s1s2s3s4s5...",
      "isActive": true,
      "createdAt": "2026-07-10T00:00:00.000Z"
    }
  },
  "timestamp": "2026-07-10T07:12:00.000Z"
}
```

---

### Execute Incoming Webhook (URL Token)

Send messages to a channel using the webhook token directly in the request path. No authentication header is required.

**Endpoint:** `POST /v3/webhooks/incoming/:token`

**Headers:**
```http
Content-Type: application/json
X-Webhook-Signature: sha256=<hmac_signature> (optional)
```

**Request Body:**
```json
{
  "content": "🚀 Production deployment v2.1.0 completed successfully!",
  "username": "Deploy Bot",
  "avatar_url": "https://example.com/bot-avatar.png",
  "attachments": [
    {
      "name": "build-log.txt",
      "type": "text/plain",
      "url": "https://example.com/logs/123.txt"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "messageId": "msg_98765"
  },
  "timestamp": "2026-07-10T07:12:05.000Z"
}
```

---

### Execute Incoming Webhook (Channel ID in Path)

Alternatively, target a channel ID directly and provide the token via header or query parameter.

**Endpoint:** `POST /v3/channels/:channelId/webhooks/incoming?token=<token>`

**Headers:**
```http
X-Webhook-Token: <token> (optional if passed via query parameter)
Content-Type: application/json
```

---

## 2. Outgoing Webhooks (Event Delivery)

Outgoing webhooks deliver event payloads to external URLs when events occur in your workspace.

### List Workspace Outgoing Webhooks

Returns all configured webhooks for a workspace. Requires `webhooks:read` scope.

**Endpoint:** `GET /v3/workspaces/:slug/webhooks`

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "wh_123",
      "name": "Production Dispatcher",
      "url": "https://your-app.com/api/webhooks",
      "events": ["message.sent", "channel.created", "member.added"],
      "active": true,
      "createdAt": "2026-07-10T00:00:00.000Z"
    }
  ],
  "timestamp": "2026-07-10T07:12:00.000Z"
}
```

---

### Create Outgoing Webhook

Register a new destination URL for workspace events. Requires `webhooks:write` scope.

**Endpoint:** `POST /v3/workspaces/:slug/webhooks`

**Request Body:**
```json
{
  "name": "Production Dispatcher",
  "url": "https://your-app.com/api/webhooks",
  "events": ["message.sent", "channel.created", "member.added"],
  "active": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "webhook": {
      "id": "wh_123",
      "name": "Production Dispatcher",
      "url": "https://your-app.com/api/webhooks",
      "events": ["message.sent", "channel.created", "member.added"],
      "active": true
    },
    "secret": "whsec_38f29d..."
  },
  "timestamp": "2026-07-10T07:12:00.000Z"
}
```

---

### Supported Outgoing Events

| Event             | Description                                                   | Payload Context                              |
| :---------------- | :------------------------------------------------------------ | :------------------------------------------- |
| `message.sent`    | A new message was posted to a channel or DM.                  | Message ID, content, channel, and author.    |
| `channel.created` | A new channel was created in the workspace.                   | Channel ID, name, workspace ID, creator.     |
| `member.added`    | A new member joined or accepted an invitation to a workspace. | Workspace ID, member user ID, assigned role.|

---

## 3. Security & Signature Verification

Scrymechat signs every outgoing webhook POST request using your secret with HMAC SHA-256. The signature is sent in the `X-Webhook-Signature` header in the format `sha256=<hash>`.

### Verification Example (Node.js)

```javascript
const crypto = require('crypto');

function verifySignature(rawPayload, secret, headerSignature) {
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawPayload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(headerSignature));
}
```

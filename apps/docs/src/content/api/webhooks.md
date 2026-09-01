# Webhooks & Integrations (Enterprise V3)

Webhooks allow your application to send and receive real-time notifications about events happening in Scrymechat. The Scrymechat V3 API provides high-performance outgoing webhooks, Discord-compatible incoming channel webhooks, and asynchronous callbacks for interactive message actions.

---

## Outgoing Workspace Webhooks

Outgoing webhooks automatically post JSON payloads to your server whenever specified events occur within a workspace. Outgoing webhooks are Redis-cached (10-minute TTL) with automatic cache invalidation upon mutation.

### Lifecycle

1. **Register**: Provide a destination URL and a list of event subscriptions.
2. **Receive**: Scrymechat dispatches an HTTP POST request to your URL when an event triggers.
3. **Verify**: Use the signature in the `X-Webhook-Signature` header (HMAC SHA-256) to verify authenticity.

### List Workspace Webhooks (V3)

Returns all configured webhooks for a given workspace. Requires `webhooks:read` scope.

**Endpoint:** `GET /v3/workspaces/:slug/webhooks`

**Headers:**
```http
Authorization: Bearer <oat_...>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "wh_123",
      "name": "Production Event Handler",
      "url": "https://your-app.com/api/webhooks",
      "events": ["message.sent", "message.action_response", "channel.created"],
      "active": true,
      "createdAt": "2026-07-10T00:00:00.000Z"
    }
  ],
  "timestamp": "2026-07-10T07:12:00.000Z"
}
```

---

### Create Workspace Webhook (V3)

Register a new outgoing webhook endpoint. Requires `webhooks:write` scope.

**Endpoint:** `POST /v3/workspaces/:slug/webhooks`

**Headers:**
```http
Authorization: Bearer <oat_...>
```

**Body:**
```json
{
  "name": "Production Event Handler",
  "url": "https://your-app.com/api/webhooks",
  "events": ["message.sent", "message.action_response", "channel.created"],
  "active": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "wh_123",
    "name": "Production Event Handler",
    "url": "https://your-app.com/api/webhooks",
    "events": ["message.sent", "message.action_response", "channel.created"],
    "active": true,
    "secret": "whsec_..."
  },
  "timestamp": "2026-07-10T07:12:00.000Z"
}
```

---

### Get Webhook Details (V3)

Retrieve configuration for a specific webhook. Requires `webhooks:read` scope.

**Endpoint:** `GET /v3/workspaces/:slug/webhooks/:webhookId`

---

### Update Webhook (V3)

Update an existing webhook configuration. Instantly invalidates Redis cache keys. Requires `webhooks:write` scope.

**Endpoint:** `PATCH /v3/workspaces/:slug/webhooks/:webhookId`

---

### Delete Webhook (V3)

Permanently deletes a webhook. Requires `webhooks:write` scope.

**Endpoint:** `DELETE /v3/workspaces/:slug/webhooks/:webhookId`

---

## Supported Outgoing Events

| Event                   | Description                                                                     |
| :---------------------- | :------------------------------------------------------------------------------ |
| `message.sent`          | A new message was posted to a channel or direct message.                        |
| `message.action_response`| A user interacted with a button/form inside an interactive custom message.      |
| `channel.created`       | A new channel was created in the workspace.                                     |
| `member.added`          | A new member joined the workspace.                                             |

---

## Incoming Channel Webhooks (Discord-Compatible)

Incoming webhooks allow external services to post messages into Scrymechat channels using standard HTTP POST requests without requiring full OAuth or M2M user authentication.

### Create Channel Incoming Webhook

**Endpoint:** `POST /v3/channels/:channelId/incoming-webhooks`

**Headers:**
```http
Authorization: Bearer <oat_...>
```

**Body:**
```json
{
  "name": "GitHub CI/CD Notifier",
  "avatarUrl": "https://example.com/github-bot.png"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "inwh_abc123",
    "token": "tok_xyz789",
    "name": "GitHub CI/CD Notifier",
    "url": "https://api.chat.scryme.tech/v3/webhooks/inwh_abc123/tok_xyz789",
    "channelId": "chan_456"
  }
}
```

### Post Message via Incoming Webhook

Dispatches a message directly to the target channel.

**Endpoint:** `POST /v3/webhooks/:webhookId/:token`

**Body:**
```json
{
  "content": "🚀 Build #42 succeeded on `main` branch!",
  "username": "CI Bot",
  "avatar_url": "https://example.com/bot-avatar.png",
  "embeds": [
    {
      "title": "Build Details",
      "description": "All 142 unit tests passed in 1.4s.",
      "color": 3066993
    }
  ]
}
```

---

## Interactive Action Webhook Callbacks

When users click interactive buttons or submit forms on messages that declare a `callbackUrl` metadata property, Scrymechat dispatches an asynchronous `message.action_response` HTTP POST payload directly to your configured `callbackUrl` or registered workspace webhooks.

### Action Response Payload Example

```json
{
  "event": "message.action_response",
  "timestamp": "2026-09-01T12:00:00.000Z",
  "workspace": {
    "id": "ws_enterprise",
    "name": "Acme Corp Workspace"
  },
  "message": {
    "id": "msg_9988",
    "content": "Deployment Approval Request",
    "channelId": "chan_prod"
  },
  "action": {
    "id": "approve_deploy",
    "label": "Approve Release"
  },
  "response": {
    "userId": "usr_dev123",
    "userName": "Jane Doe",
    "userEmail": "jane@acme.com",
    "actionValue": "approve_deploy",
    "comment": "Approved for staging deployment",
    "metadata": {
      "environment": "staging"
    },
    "respondedAt": "2026-09-01T12:00:00.000Z"
  }
}
```

---

## Security & Signature Verification

Scrymechat signs every webhook request using standard timing-safe HMAC SHA-256 signatures. The signature is included in the `X-Webhook-Signature` header (formatted as `sha256=<hash>`).

### Node.js Verification Example

```javascript
const crypto = require('crypto');

function verifyWebhook(rawPayload, secret, headerSignature) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(rawPayload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(headerSignature));
}
```

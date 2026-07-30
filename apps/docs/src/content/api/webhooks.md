# Webhooks (Enterprise V3)

Webhooks allow your application to receive real-time notifications about events happening in Scrymechat. The Scrymechat V3 API provides a high-performance, Redis-cached webhooks interface designed for massive enterprise volume.

---

## Lifecycle

1. **Register**: Provide a URL and a list of events you want to subscribe to.
2. **Receive**: Scrymechat sends an HTTP POST request to your URL when an event occurs.
3. **Verify**: Use the webhook secret to verify that the request came from Scrymechat.

---

## Managing Webhooks via V3 API

All V3 webhooks are fully integrated with Redis caching (10-minute TTL) and automatic cache invalidation upon mutation.

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
      "name": "My V3 Integration",
      "url": "https://your-app.com/api/webhooks",
      "events": ["message.sent", "channel.created"],
      "active": true,
      "createdAt": "2026-07-10T00:00:00.000Z"
    }
  ],
  "timestamp": "2026-07-10T07:12:00.000Z"
}
```

---

### Create V3 Webhook

Register a new high-performance destination for events. Requires `webhooks:write` scope.

**Endpoint:** `POST /v3/workspaces/:slug/webhooks`

**Headers:**
```http
Authorization: Bearer <oat_...>
```

**Body:**
```json
{
  "name": "My V3 Integration",
  "url": "https://your-app.com/api/webhooks",
  "events": ["message.sent", "channel.created"],
  "active": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "wh_123",
    "name": "My V3 Integration",
    "url": "https://your-app.com/api/webhooks",
    "events": ["message.sent", "channel.created"],
    "active": true,
    "secret": "whsec_..."
  },
  "timestamp": "2026-07-10T07:12:00.000Z"
}
```

---

### Get Webhook Details (V3)

Retrieve configuration and details for a specific webhook by its ID. Requires `webhooks:read` scope.

**Endpoint:** `GET /v3/workspaces/:slug/webhooks/:webhookId`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "wh_123",
    "name": "My V3 Integration",
    "url": "https://your-app.com/api/webhooks",
    "events": ["message.sent", "channel.created"],
    "active": true
  },
  "timestamp": "2026-07-10T07:12:00.000Z"
}
```

---

### Update Webhook (V3)

Update an existing webhook configuration. Instantly invalidates relevant Redis cache keys. Requires `webhooks:write` scope.

**Endpoint:** `PATCH /v3/workspaces/:slug/webhooks/:webhookId`

**Body:**
```json
{
  "name": "Updated V3 Integration",
  "active": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "wh_123",
    "name": "Updated V3 Integration",
    "url": "https://your-app.com/api/webhooks",
    "events": ["message.sent", "channel.created"],
    "active": false
  },
  "timestamp": "2026-07-10T07:14:00.000Z"
}
```

---

### Delete Webhook (V3)

Permanently deletes a webhook. Instantly invalidates relevant Redis cache keys. Requires `webhooks:write` scope.

**Endpoint:** `DELETE /v3/workspaces/:slug/webhooks/:webhookId`

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true
  },
  "timestamp": "2026-07-10T07:15:00.000Z"
}
```

---

## Supported Events

| Event             | Description                                  |
| :---------------- | :------------------------------------------- |
| `message.sent`    | A new message was posted to a channel or DM. |
| `channel.created` | A new channel was created in the workspace.  |
| `member.added`    | A new member joined the workspace.           |

---

## Security & Signature Verification

Scrymechat signs every webhook request with your `secret` (using standard timing-safe HMAC SHA-256 signatures). The signature is included in the `X-Webhook-Signature` header.

### Node.js Verification Example

```javascript
const crypto = require('crypto');

function verify(payload, secret, signature) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}
```

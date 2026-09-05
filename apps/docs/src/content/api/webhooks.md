# Webhooks (Enterprise V3)

Webhooks allow external applications to seamlessly communicate with Scrymechat. The Scrymechat V3 API provides a high-performance, Redis-cached webhooks interface designed for massive enterprise event processing and automated channel messaging.

---

## Webhook Architecture Overview

Scrymechat supports two primary webhook communication patterns:

1. **Incoming Webhooks**: Allow external systems (CI/CD pipelines, GitHub, monitoring services, internal alerts) to post messages and file attachments directly into specific workspace channels using a unique URL token—without full OAuth user login.
2. **Outgoing Webhooks**: Send HTTP POST requests from Scrymechat to your registered external HTTPS endpoints in real-time whenever events occur in your workspace (such as `message.sent`, `channel.created`, or `member.added`).

---

## 1. Incoming Webhooks (Channel Integration)

Incoming webhooks give external tools a fast, tokenized endpoint for posting messages to designated workspace channels.

### Creating an Incoming Webhook

**Endpoint:** `POST /v3/workspaces/:slug/channels/:channelId/incoming-webhooks`
**Required Scope:** `webhooks:write` or `*`

#### Request Headers
```http
Authorization: Bearer <user_or_m2m_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "name": "GitHub Deployment Bot",
  "description": "Posts production build alerts to #deployments"
}
```

#### Response Example (201 Created)
```json
{
  "success": true,
  "data": {
    "webhook": {
      "id": "cwh_987654321",
      "channelId": "ch_deployments_123",
      "name": "GitHub Deployment Bot",
      "description": "Posts production build alerts to #deployments",
      "token": "tok_sec_9f8e7d6c5b4a321",
      "secret": "whsec_38f29d81a742c0192e4b",
      "isActive": true,
      "createdAt": "2026-03-31T12:00:00.000Z"
    }
  },
  "timestamp": "2026-03-31T12:00:00.000Z"
}
```

---

### Executing an Incoming Webhook

To dispatch a message into a channel, send an HTTP POST request containing your webhook token.

#### Method 1: Token in Path (Recommended)
**Endpoint:** `POST /v3/webhooks/incoming/:token`

#### Method 2: Channel ID & Token Header
**Endpoint:** `POST /v3/channels/:channelId/webhooks/incoming?token=<token>`
**Headers:**
```http
X-Webhook-Token: <token>
Content-Type: application/json
```

#### Incoming Webhook Payload Options

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `content` | string | Yes | The body text of the message. Full Markdown formatting is supported. |
| `username` | string | No | Custom bot display name (overrides the default webhook name). |
| `avatar_url` | string | No | Custom avatar image URL for the posted message. |
| `attachments` | array | No | Array of media/file attachment objects. |

#### Example Request Body
```json
{
  "content": "🚀 **Deployment Successful**\nBuild `#2048` deployed to `production` cluster in **1.4s**.",
  "username": "CI Release Manager",
  "avatar_url": "https://assets.scryme.tech/icons/deploy-bot.png",
  "attachments": [
    {
      "name": "build-summary.json",
      "type": "application/json",
      "url": "https://ci.acme.com/artifacts/build-2048.json"
    }
  ]
}
```

#### Response Example (200 OK)
```json
{
  "success": true,
  "data": {
    "success": true,
    "messageId": "msg_01H123456789"
  },
  "timestamp": "2026-03-31T12:00:02.000Z"
}
```

---

## 2. Outgoing Webhooks (Event Delivery)

Outgoing webhooks deliver real-time workspace event payloads to your server endpoints.

### Managing Outgoing Webhooks

- **List Webhooks**: `GET /v3/workspaces/:slug/webhooks` (Scope: `webhooks:read`)
- **Get Webhook Details**: `GET /v3/workspaces/:slug/webhooks/:webhookId` (Scope: `webhooks:read`)
- **Create Webhook**: `POST /v3/workspaces/:slug/webhooks` (Scope: `webhooks:write`)
- **Update Webhook**: `PATCH /v3/workspaces/:slug/webhooks/:webhookId` (Scope: `webhooks:write`)
- **Delete Webhook**: `DELETE /v3/workspaces/:slug/webhooks/:webhookId` (Scope: `webhooks:write`)

---

### Outgoing Event Types & Payloads

Scrymechat dispatches JSON payloads to registered URLs for subscribed events. Every event object follows a standard envelope structure:

```json
{
  "id": "evt_7f8a9b0c1d2e",
  "type": "message.sent",
  "workspaceId": "ws_acme_corp",
  "createdAt": "2026-03-31T12:05:00.000Z",
  "data": { ... }
}
```

#### Supported Event Types

| Event Type | Description | Trigger Context |
| :--- | :--- | :--- |
| `message.sent` | A new message was posted in a channel or DM. | Message object, channel ID, author details. |
| `channel.created` | A new channel was created in the workspace. | Channel ID, channel name, team, creator ID. |
| `member.added` | A user joined or was added to the workspace. | Workspace ID, user ID, assigned role. |

#### Event Payload Examples

##### `message.sent` Payload
```json
{
  "id": "evt_9182736450",
  "type": "message.sent",
  "workspaceId": "ws_acme_corp",
  "createdAt": "2026-03-31T12:05:00.000Z",
  "data": {
    "id": "msg_998877",
    "channelId": "ch_general",
    "content": "Meeting starts in 5 minutes!",
    "author": {
      "id": "usr_123",
      "name": "Jane Doe",
      "email": "jane@acme.com"
    }
  }
}
```

##### `channel.created` Payload
```json
{
  "id": "evt_1122334455",
  "type": "channel.created",
  "workspaceId": "ws_acme_corp",
  "createdAt": "2026-03-31T12:10:00.000Z",
  "data": {
    "id": "ch_prod_alerts",
    "name": "prod-alerts",
    "topic": "System Health & Monitoring",
    "createdBy": "usr_456"
  }
}
```

##### `member.added` Payload
```json
{
  "id": "evt_5566778899",
  "type": "member.added",
  "workspaceId": "ws_acme_corp",
  "createdAt": "2026-03-31T12:15:00.000Z",
  "data": {
    "workspaceId": "ws_acme_corp",
    "userId": "usr_789",
    "role": "member",
    "joinedAt": "2026-03-31T12:15:00.000Z"
  }
}
```

---

## 3. HMAC SHA-256 Signature Verification

To guarantee request integrity and authenticity, every outgoing webhook delivery includes two security headers:

- `X-Webhook-Signature`: Signature in the format `sha256=<hex_hmac>`
- `X-Webhook-Event`: The event type string (e.g. `message.sent`)

Your application **must** verify this signature using your webhook secret before processing event payloads.

### Verification Code Examples

#### Node.js / TypeScript
```typescript
import * as crypto from 'crypto';

export function verifyWebhookSignature(
  rawBody: string,
  secret: string,
  headerSignature: string
): boolean {
  if (!headerSignature || !headerSignature.startsWith('sha256=')) {
    return false;
  }

  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  const expectedBuffer = Buffer.from(expectedSignature);
  const actualBuffer = Buffer.from(headerSignature);

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}
```

#### Python (Flask / FastAPI)
```python
import hmac
import hashlib

def verify_webhook_signature(raw_body: bytes, secret: str, header_signature: str) -> bool:
    if not header_signature or not header_signature.startswith("sha256="):
        return False

    expected = "sha256=" + hmac.new(
        secret.encode("utf-8"),
        raw_body,
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(expected, header_signature)
```

#### Go
```go
package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"strings"
)

func VerifySignature(rawPayload []byte, secret string, headerSignature string) bool {
	if !strings.HasPrefix(headerSignature, "sha256=") {
		return false
	}

	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(rawPayload)
	expectedSig := "sha256=" + hex.EncodeToString(mac.Sum(nil))

	return subtle.ConstantTimeCompare([]byte(expectedSig), []byte(headerSignature)) == 1
}
```

---

## 4. Delivery Behavior & Caching

- **Timeout**: Scrymechat enforces a 5-second HTTP request timeout per webhook dispatch.
- **Async Non-Blocking Execution**: Webhook event dispatch is executed asynchronously in background background threads (`Promise.allSettled`), ensuring API response latency remains sub-10ms.
- **Redis Caching**: Workspace webhooks are cached in Redis under key `v3:workspace:<workspaceId>:webhooks` with a **10-minute TTL**. Creating, updating, or deleting webhooks automatically invalidates the Redis cache instantly.
- **Delivery Logging**: Outgoing webhooks record delivery status, status codes, and execution payloads in `WorkspaceWebhookLog` for diagnostic inspection.

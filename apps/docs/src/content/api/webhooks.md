# Webhooks

Webhooks allow your application to receive real-time notifications about events happening in Skyrme Chat.

## Lifecycle

1. **Register**: Provide a URL and a list of events you want to subscribe to.
2. **Receive**: Skyrme Chat sends an HTTP POST request to your URL when an event occurs.
3. **Verify**: Use the webhook secret to verify that the request came from Skyrme Chat.

---

## Managing Webhooks

### List Webhooks
**Endpoint:** `GET /v2/workspaces/:slug/webhooks`

---

### Create Webhook
Register a new destination for events.

**Endpoint:** `POST /v2/workspaces/:slug/webhooks`

**Body:**
```json
{
  "name": "My Integration",
  "url": "https://your-app.com/api/webhooks",
  "events": ["message.sent", "channel.created"],
  "active": true
}
```

**Response:**
Returns the webhook configuration, including a `secret`. **Save this secret**, as it will not be shown again.

---

## Supported Events

| Event | Description |
| :--- | :--- |
| `message.sent` | A new message was posted to a channel or DM. |
| `channel.created` | A new channel was created in the workspace. |
| `member.added` | A new member joined the workspace. |

---

## Security & Verification

Skyrme Chat signs every webhook request with your secret. The signature is included in the `X-Skyrme-Signature` header.

**Verification Example (Node.js):**
```javascript
const crypto = require('crypto');

function verify(payload, secret, signature) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return digest === signature;
}
```

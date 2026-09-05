# Webhook Integrations

Webhooks provide a lightweight, real-time mechanism to integrate Scrymechat with your existing developer stack. Whether you want to send automated notifications into channels or react instantly when workspace events happen, webhooks make real-time integration straightforward.

---

## What are Webhooks?

Webhooks are automated HTTP messages sent when something happens. They allow two-way communication between Scrymechat and external platforms:

- **Incoming Webhooks**: Post alerts, build summaries, and system status messages into workspace channels.
- **Outgoing Webhooks**: Receive real-time push notifications on your server when workspace activity occurs.

---

## 1. Setting Up Incoming Webhooks

Incoming webhooks generate a unique URL token for a specific channel. Any external service can send an HTTP POST request to this URL to broadcast messages.

### Step-by-step Setup Guide

1. Navigate to your workspace channel settings or developer integrations panel.
2. Select **Incoming Webhooks** and click **Create Webhook**.
3. Choose the target channel (e.g. `#deployments` or `#general`).
4. Enter a friendly name (e.g. `Build Bot`) and save.
5. Copy the generated **Webhook Token** or **Webhook URL**.

> TIP: Keep your Webhook URL confidential! Anyone with the URL can post messages to your channel.

### Sending Your First Webhook Message

You can send a POST request using cURL or any HTTP library:

```bash
curl -X POST "https://api.chat.scryme.tech/v3/webhooks/incoming/YOUR_WEBHOOK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "🎉 **New Release Deployed!**\nVersion `v3.2.0` is now live in production.",
    "username": "Release Bot",
    "avatar_url": "https://assets.scryme.tech/icons/rocket.png"
  }'
```

> SUCCESS: The message will immediately appear in your designated channel with rich Markdown formatting!

---

## 2. Setting Up Outgoing Webhooks

Outgoing webhooks send real-time event notifications from Scrymechat to your server endpoint whenever activity occurs in your workspace.

### Step-by-step Setup Guide

1. Go to **Workspace Settings** > **Integrations** > **Webhooks**.
2. Click **Add Outgoing Webhook**.
3. Enter your destination URL (e.g., `https://your-domain.com/api/webhooks`).
4. Select the events you want to listen to (`message.sent`, `channel.created`, `member.added`).
5. Save the webhook and safely store the generated **Signing Secret**.

---

## 3. Securing Outgoing Webhooks

To prevent unauthorized requests, Scrymechat signs every outgoing webhook payload using HMAC SHA-256.

### Validating Requests on Your Server

When your endpoint receives a POST request:

1. Extract the `X-Webhook-Signature` header (e.g., `sha256=a1b2c3...`).
2. Read the raw request body as bytes.
3. Compute the HMAC SHA-256 hash using your saved signing secret.
4. Compare the computed hash with the header signature in constant time.

```javascript
// Node.js Express Example
const crypto = require('crypto');

app.post('/api/webhooks', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const secret = process.env.WEBHOOK_SECRET;

  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(req.body)
    .digest('hex');

  if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
    const event = JSON.parse(req.body);
    console.log('Received valid event:', event.type);
    res.status(200).send('OK');
  } else {
    res.status(401).send('Invalid signature');
  }
});
```

---

## Troubleshooting Webhooks

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| `404 Not Found` | Invalid webhook token | Verify the webhook token in the request URL. |
| `401 Unauthorized` | Invalid HMAC signature | Ensure you are using the raw HTTP request body for hash calculation. |
| `504 Timeout` | Endpoint response > 5 seconds | Respond immediately with `200 OK` and process long tasks in background queues. |

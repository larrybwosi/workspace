# Recipe: How to Build a Bot

This guide walks you through creating a simple "Hello World" bot that responds to messages in Skyrme Chat.

## Prerequisites

- A Skyrme Chat workspace where you have admin permissions.
- A server or serverless function capable of receiving HTTPS requests (for webhooks).

## Step 1: Create your Bot Application

1. Navigate to **Workspace Settings** > **Developer Portal**.
2. Click **Create New App**.
3. Name your app (e.g., "GreetingBot") and give it a description.
4. Note your **Client ID** and **Client Secret**.

## Step 2: Configure Permissions

In your app settings, ensure you have the following scopes:
- `messages:read`
- `messages:send`

## Step 3: Set up a Webhook

1. Use the [Webhooks API](/api-reference/webhooks) or the Developer Portal to register a webhook.
2. Set the URL to your server's endpoint.
3. Subscribe to the `message.sent` event.

## Step 4: Handle Incoming Messages

When someone sends a message, Skyrme Chat will POST a payload to your URL. Your code should:

1. **Verify the signature** to ensure the request is legitimate.
2. **Check the content**.
3. **Reply** if a condition is met.

### Node.js Example (Express)

```javascript
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const CLIENT_ID = 'your_client_id';
const CLIENT_SECRET = 'your_client_secret';
const WORKSPACE_SLUG = 'your-workspace-slug';

app.post('/webhook', async (req, res) => {
  const { event, data } = req.body;

  if (event === 'message.sent' && data.message.content.includes('hello bot')) {
    const channelId = data.message.channelId;

    // 1. Get Token
    const authRes = await axios.post('https://api.skyrme.chat/v2/oauth/token', {
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET
    });
    const token = authRes.data.access_token;

    // 2. Send Reply
    await axios.post(`https://api.skyrme.chat/v2/workspaces/${WORKSPACE_SLUG}/messages`, {
      channelId,
      content: `Hello @${data.message.user.name}! I am a Skyrme Bot.`
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  res.status(200).send('OK');
});

app.listen(3000);
```

## Step 5: Test it out!

Invite your bot to a channel (or mention it if it's a global bot) and type "hello bot". You should see your bot reply instantly!

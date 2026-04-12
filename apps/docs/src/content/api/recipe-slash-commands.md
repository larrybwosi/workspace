# Recipe: Building Slash Commands

Slash commands are a powerful way for users to interact with your application directly from the Skyrme Chat message box. While Skyrme Chat doesn't yet have a native "Slash Command" registry, you can easily simulate this functionality using Webhooks and pattern matching.

## How it Works

1. **User types a command**: For example, `/weather London`.
2. **Webhook triggers**: Your server receives a `message.sent` event.
3. **Parse & Respond**: Your server detects the `/` prefix, parses the command, and sends a reply or performs an action.

---

## Step 1: Subscribe to Messages

Ensure your Bot App is subscribed to the `message.sent` event via [Webhooks](/api-reference/webhooks).

## Step 2: Handle the Command

In your webhook handler, check if the incoming message starts with your command prefix.

### Node.js Example (Express + TypeScript)

```typescript
import express from 'express';
import axios from 'axios';

const app = express();
app.use(express.json());

const COMMAND_PREFIX = '/';

app.post('/webhook', async (req, res) => {
  const { event, data } = req.body;

  if (event === 'message.sent') {
    const { content, channelId } = data.message;

    if (content.startsWith(COMMAND_PREFIX)) {
      const args = content.slice(COMMAND_PREFIX.length).trim().split(/ +/);
      const command = args.shift()?.toLowerCase();

      if (command === 'echo') {
        await sendReply(channelId, `You said: ${args.join(' ')}`);
      }
    }
  }

  res.sendStatus(200);
});

async function sendReply(channelId: string, text: string) {
  await axios.post(`https://api.skyrme.chat/v2/workspaces/my-workspace/messages`, {
    channelId,
    content: text
  }, {
    headers: { 'Authorization': `Bearer ${process.env.SKYRME_TOKEN}` }
  });
}
```

### Python Example (Flask)

```python
from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

@app.route('/webhook', methods=['POST'])
def webhook():
    payload = request.json
    event = payload.get('event')
    data = payload.get('data')

    if event == 'message.sent':
        content = data['message']['content']
        channel_id = data['message']['channelId']

        if content.startswith('/'):
            parts = content[1:].split()
            command = parts[0].lower()
            args = parts[1:]

            if command == 'ping':
                requests.post(
                    'https://api.skyrme.chat/v2/workspaces/my-workspace/messages',
                    json={'channelId': channel_id, 'content': 'Pong! 🏓'},
                    headers={'Authorization': f'Bearer {YOUR_TOKEN}'}
                )

    return 'OK', 200
```

---

## Step 3: Interactive Responses

Instead of just plain text, you can respond with **Interactive Actions** or **Custom Metadata** to create a richer experience.

```typescript
// Example: Sending a message with buttons
const MESSAGES_URL = `https://api.skyrme.chat/v2/workspaces/my-workspace/messages`;
await axios.post(MESSAGES_URL, {
  channelId,
  content: "Select an option:",
  messageType: "custom",
  actions: [
    { actionId: "opt_1", label: "Option 1", style: "primary" },
    { actionId: "opt_2", label: "Option 2", style: "secondary" }
  ]
});
```

See [Messages & Channels](/api-reference/messages) for more details on interactive elements.

# Real-time Events with Ably

Skyrme Chat uses [Ably](https://ably.com) to deliver messages and events in real-time. While you can use Webhooks for server-to-server notifications, connecting directly to Ably is recommended for building interactive clients or bots that need low-latency updates.

## Connection Overview

To receive real-time events, your application must:
1. **Authenticate**: Get an Ably Token Request from the Skyrme Chat API.
2. **Connect**: Initialize the Ably SDK using the token request.
3. **Subscribe**: Listen to specific channels for events.

---

## 1. Authentication

Skyrme Chat provides an endpoint to exchange your API access token for an Ably Token Request.

**Endpoint:** `POST /api/ably/token` (Note: In V2, use your Bearer token in the Authorization header)

### Example Request

```bash
curl -X POST https://api.skyrme.chat/api/ably/token \
  -H "Authorization: Bearer <your_access_token>"
```

### Example Response

```json
{
  "keyName": "...",
  "clientId": "user_123",
  "capability": "{\"channel:*\":[\"subscribe\"], ...}",
  "timestamp": 1625000000000,
  "nonce": "...",
  "mac": "..."
}
```

---

## 2. Connecting to Ably

Use the official Ably SDKs to connect. We recommend using the `Realtime` client.

### Node.js / TypeScript Example

```typescript
import * as Ably from 'ably';

async function connectToAbly(accessToken: string) {
  const realtime = new Ably.Realtime({
    authCallback: async (tokenParams, callback) => {
      try {
        const response = await fetch('https://api.skyrme.chat/api/ably/token', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const tokenRequest = await response.json();
        callback(null, tokenRequest);
      } catch (error) {
        callback(error, null);
      }
    }
  });

  realtime.connection.on('connected', () => {
    console.log('Connected to Skyrme Chat Real-time!');
  });

  return realtime;
}
```

### Python Example

```python
import ably
import requests

def connect_to_ably(access_token):
    def auth_callback(token_params):
        response = requests.post(
            'https://api.skyrme.chat/api/ably/token',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        return response.json()

    client = ably.AblyRealtime(auth_callback=auth_callback)
    return client

# Usage
# client = connect_to_ably('your_token')
```

---

## 3. Channels & Events

Skyrme Chat organizes events into channels. You must subscribe to the correct channel to receive the events you're interested in.

### Channel Naming Conventions

| Channel Type | Format | Description |
| :--- | :--- | :--- |
| **Channel** | `channel:{channelId}` | Public or private channel messages and updates. |
| **Direct Message** | `dm:{dmId}` | Messages in a DM. |
| **Thread** | `thread:{threadId}` | Replies within a specific message thread. |
| **User** | `user:{userId}` | User-specific events (e.g., status changes). |
| **Workspace** | `workspace:{workspaceId}` | Workspace-wide events (e.g., channel creation). |

### Supported Events

Common events you can listen for on these channels:

- `message:sent`: A new message was received.
- `message:updated`: A message was edited.
- `message:deleted`: A message was removed.
- `message:reaction`: A reaction was added or removed.
- `typing:start`: A user started typing.
- `typing:stop`: A user stopped typing.

### Example: Subscribing to a Channel

```typescript
const channel = realtime.channels.get('channel:chan_123');

channel.subscribe('message:sent', (message) => {
  console.log('New message received:', message.data);
});
```

```python
channel = client.channels.get('channel:chan_123')

def on_message(message):
    print(f"New message: {message.data}")

channel.subscribe('message:sent', on_message)
```

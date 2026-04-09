# Messages

Endpoints for managing channels and sending messages within a workspace.

## Channels

### List Channels
Returns all channels in the workspace.

**Endpoint:** `GET /v2/workspaces/:slug/channels`

---

### Create Channel
Creates a new public or private channel.

**Endpoint:** `POST /v2/workspaces/:slug/channels`

**Body:**
```json
{
  "name": "project-alpha",
  "type": "public",
  "description": "Discussion for Project Alpha"
}
```

---

## Messaging

### Send a Message
Sends a message to a channel or a specific recipient.

**Endpoint:** `POST /v2/workspaces/:slug/messages`

**Body:**
```json
{
  "channelId": "channel_id",
  "content": "Hello World!",
  "messageType": "standard"
}
```

| Field | Type | Description |
| :--- | :--- | :--- |
| `channelId` | `string` | Target channel ID. |
| `recipientId` | `string` | Target user ID (for DMs). |
| `content` | `string` | The text content of the message. |
| `threadId` | `string` | (Optional) Reply to a specific thread. |
| `messageType` | `string` | (Optional) `standard`, `custom`, `approval`, etc. |
| `metadata` | `object` | (Optional) Additional structured data. |

---

### List Messages
Retrieves message history for a channel.

**Endpoint:** `GET /v2/workspaces/:slug/messages`

**Query Parameters:**
- `channelId`: The channel to fetch from.
- `limit`: Number of messages (default 50).
- `cursor`: Pagination cursor.

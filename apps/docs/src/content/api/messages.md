# Messages & Channels

Communication in Skyrme Chat happens through channels or direct messages. The API allows you to automate these interactions, from simple notifications to complex interactive bots.

## Channels

Channels are shared spaces for team members.

### List Channels
**Endpoint:** `GET /v2/workspaces/:slug/channels`

---

### Create Channel
**Endpoint:** `POST /v2/workspaces/:slug/channels`

**Body:**
```json
{
  "name": "incident-reports",
  "type": "public",
  "description": "Critical system alerts"
}
```

---

### Update Channel Icon
Upload a new icon for a channel using `multipart/form-data`.

**Endpoint:** `POST /v2/workspaces/:slug/channels/:channelId/icon`

---

## Messaging

### Send a Message
Send a message to a channel or a specific user.

**Endpoint:** `POST /v2/workspaces/:slug/messages`

**Body Fields:**

| Field | Type | Description |
| :--- | :--- | :--- |
| `channelId` | `string` | Target channel ID. |
| `recipientId` | `string` | Target user ID (for DMs). |
| `content` | `string` | The text content of the message. |
| `threadId` | `string` | (Optional) ID of a message to reply to. |
| `contextId` | `string` | (Optional) A custom tag to group messages into a thread. |
| `messageType` | `string` | `standard`, `custom`, `approval`, or `report`. |
| `metadata` | `object` | (Optional) Custom JSON data for `custom` message types. |
| `actions` | `array` | (Optional) Interactive buttons to attach to the message. |

**Example (Interactive Message):**
```json
{
  "channelId": "chan_123",
  "content": "New deployment request",
  "messageType": "approval",
  "actions": [
    { "actionId": "approve", "label": "Approve", "style": "primary", "value": "deploy_prod_123" },
    { "actionId": "deny", "label": "Deny", "style": "danger", "value": "deploy_prod_123" }
  ]
}
```

### Interactive Actions

Interactive actions allow users to trigger webhooks in your application by clicking buttons on a message.

1. **User clicks a button**: Skyrme Chat sends an `action.triggered` webhook to your app.
2. **Payload**: The payload includes the `actionId`, `value`, `messageId`, and the user who clicked it.
3. **Response**: Your server should respond with a `200 OK`. You can also optionally update the original message to reflect the new state.

### Custom Metadata

The `metadata` field allows you to store structured JSON data with your message. This is particularly useful for `custom` message types where you want to render a specific UI on the client.

```json
{
  "channelId": "chan_123",
  "content": "Stock Update: AAPL",
  "messageType": "custom",
  "metadata": {
    "symbol": "AAPL",
    "price": 150.25,
    "change": "+1.2%"
  }
}
```

---

### List Messages
**Endpoint:** `GET /v2/workspaces/:slug/messages`

**Query Parameters:**
- `channelId`: Filter by channel.
- `threadId`: Filter by thread.
- `contextId`: Filter by a custom context tag.
- `limit`: Number of messages (max 100).
- `cursor`: Token for pagination.

---

## Real-time Events

Skyrme Chat uses Ably for real-time delivery. When you send a message via the API, it is automatically broadcast to all connected clients in the workspace.

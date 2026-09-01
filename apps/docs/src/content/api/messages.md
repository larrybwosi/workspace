# Messages & Channels

Communication in Scrymechat happens through channels or direct messages. The API allows you to automate these interactions, from simple notifications to complex interactive bots.

## Channels

Channels are shared spaces for team members.

### List Channels

**Endpoint:** `GET /v3/workspaces/:slug/channels`

---

### Create Channel

**Endpoint:** `POST /v3/workspaces/:slug/channels`

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

**Endpoint:** `POST /v3/workspaces/:slug/channels/:channelId/icon`

---

## Messaging

### Send a Message

Send a message to a channel or a specific user.

**Endpoint:** `POST /v3/workspaces/:slug/messages`

**Body Fields:**

| Field         | Type     | Description                                              |
| :------------ | :------- | :------------------------------------------------------- |
| `channelId`   | `string` | Target channel ID.                                       |
| `recipientId` | `string` | Target user ID (for DMs).                                |
| `content`     | `string` | The text content of the message.                         |
| `threadId`    | `string` | (Optional) ID of a message to reply to.                  |
| `contextId`   | `string` | (Optional) A custom tag to group messages into a thread. |
| `messageType` | `string` | `standard`, `custom`, `approval`, or `report`.           |
| `metadata`    | `object` | (Optional) Custom JSON data for `custom` message types.  |
| `actions`     | `array`  | (Optional) Interactive buttons to attach to the message. |

**Example (Interactive Message):**

```json
{
  "channelId": "chan_123",
  "content": "New deployment request",
  "messageType": "approval",
  "metadata": {
    "callbackUrl": "https://your-bot.example.com/api/actions/callback"
  },
  "actions": [
    { "actionId": "approve", "label": "Approve", "style": "primary", "value": "deploy_prod_123" },
    { "actionId": "deny", "label": "Deny", "style": "danger", "value": "deploy_prod_123" }
  ]
}
```

---

## Interactive Actions & Response Triggers

Interactive actions enable in-chat workflows where clicking a button or submitting a form in a message dispatches structured data back to your backend.

### Triggering an Interactive Action

When a client clicks a button or submits form data, the client sends a request to trigger the action:

**Endpoint:** `POST /workspaces/:slug/messages/:messageId/actions`

**Headers:**
```http
Authorization: Bearer <token>
```

**Body:**
```json
{
  "actionId": "approve",
  "comment": "Approved for deployment",
  "metadata": {
    "environment": "staging"
  }
}
```

**Execution Pipeline:**

1. **Database Logging**: Scrymechat logs the action response (`MessageActionResponse`) linked to the message and user.
2. **Realtime Broadcast**: Broadcasts a `message.action_response` event over WebSocket/Ably to update UI across all active workspace clients.
3. **Webhook Dispatch**: If `metadata.callbackUrl` is specified on the message, an HTTP POST request containing the response details is dispatched to the callback URL with an HMAC SHA-256 signature (`X-Webhook-Signature`).
4. **Audit Logging**: Creates a `workspaceAuditLog` entry tracking the action execution for enterprise compliance.

### Fetch Action Responses

Retrieve all recorded user responses and form submissions for a specific message.

**Endpoint:** `GET /workspaces/:slug/messages/:messageId/actions`

**Response:**
```json
{
  "success": true,
  "responses": [
    {
      "id": "resp_001",
      "actionId": "act_approve",
      "messageId": "msg_9988",
      "userId": "usr_dev123",
      "actionValue": "approve",
      "comment": "Approved for deployment",
      "metadata": {
        "environment": "staging"
      },
      "respondedAt": "2026-09-01T12:00:00.000Z",
      "user": {
        "id": "usr_dev123",
        "name": "Jane Doe",
        "email": "jane@acme.com",
        "avatar": "https://example.com/avatar.jpg"
      }
    }
  ]
}
```

---

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

**Endpoint:** `GET /v3/workspaces/:slug/messages`

**Query Parameters:**

- `channelId`: Filter by channel.
- `threadId`: Filter by thread.
- `contextId`: Filter by a custom context tag.
- `limit`: Number of messages (max 100).
- `cursor`: Token for pagination.

---

## Real-time Events

Scrymechat uses real-time event broadcasting for message delivery. When you send a message via the API, it is automatically broadcast to all connected clients in the workspace.

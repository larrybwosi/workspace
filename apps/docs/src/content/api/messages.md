# Messages & Channels

Communication in Scrymechat happens through channels or direct messages. The API allows you to automate these interactions, from simple notifications to complex interactive bots and customized UI cards.

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

## Messaging (V3 Enterprise API)

### Send Channel Message

Send a standard message to a specific channel.

**Endpoint:** `POST /v3/workspaces/:slug/channels/:channelId/messages`
**Required Scope:** `messages:send` or `*`

**Body Fields:**

| Field         | Type     | Description                                              |
| :------------ | :------- | :------------------------------------------------------- |
| `content`     | `string` | The text content of the message.                         |
| `replyToId`   | `string` | (Optional) ID of a message to reply to.                  |
| `messageType` | `string` | `standard`, `custom`, `approval`, `report`, or `form`.   |
| `metadata`    | `object` | (Optional) Custom JSON data or metadata for the message.  |
| `actions`     | `array`  | (Optional) Interactive buttons to attach to the message. |

---

### Send Custom Message (`CustomMessageSchema`)

Send a structured, node-based interactive message conforming to `CustomMessageSchema`.

**Endpoint:** `POST /v3/workspaces/:slug/channels/:channelId/messages/custom`
**Required Scope:** `messages:send` or `*`

#### Request Body Structure

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `content` | `string` | No | Fallback plain text string for notifications or simplified clients. |
| `customMessage` | `object` | Yes | Custom message payload object matching `CustomMessageSchema`. |
| `replyToId` | `string` | No | ID of message thread to reply to. |

#### Custom Message JSON Payload (`customMessage`)

```json
{
  "content": "Deployment Approval Request",
  "customMessage": {
    "version": "v1",
    "type": "APPROVAL",
    "context": {
      "title": "Production Deployment #8042",
      "description": "Triggered by CI/CD Pipeline",
      "icon": "Rocket",
      "priority": "urgent"
    },
    "theme": {
      "accentColor": "#6366f1",
      "backgroundColor": "#111827",
      "textColor": "#ffffff",
      "primaryButtonColor": "#4f46e5"
    },
    "root": {
      "type": "Layout.Card",
      "children": [
        {
          "type": "Layout.Grid",
          "properties": { "columns": 2 },
          "children": [
            { "type": "Display.Field", "properties": { "label": "Environment", "value": "Production (us-east-1)" } },
            { "type": "Display.Field", "properties": { "label": "Triggered By", "value": "GitHub Actions" } }
          ]
        },
        {
          "id": "deployment_reason",
          "type": "Input.Text",
          "properties": { "label": "Approval Comment / Reason", "placeholder": "Enter notes..." },
          "validation": { "required": true, "errorMessage": "Comment is required" }
        }
      ]
    },
    "actions": [
      {
        "id": "approve",
        "label": "Approve Deployment",
        "type": "PRIMARY",
        "icon": "Check",
        "handler": {
          "type": "CALLBACK",
          "callbackId": "deploy-pipeline-8042",
          "payload": { "buildId": "8042", "action": "approve" },
          "includeFormState": true
        }
      },
      {
        "id": "reject",
        "label": "Reject",
        "type": "DESTRUCTIVE",
        "icon": "X",
        "handler": {
          "type": "CALLBACK",
          "callbackId": "deploy-pipeline-8042",
          "payload": { "buildId": "8042", "action": "reject" },
          "includeFormState": true
        }
      }
    ],
    "data": {
      "buildId": "8042"
    }
  }
}
```

#### Node Types Reference

| Component Node Type | Category | Properties |
| :--- | :--- | :--- |
| `Layout.Card` | Layout | `className`: string CSS helper. |
| `Layout.Stack` | Layout | `className`: string CSS helper. |
| `Layout.Grid` | Layout | `columns`: number of grid columns (default 1). |
| `Text.Heading` | Display | `content`: heading text string (supports Mustache interpolation `{{var}}`). |
| `Text.Paragraph` | Display | `content`: body markdown text. |
| `Display.Field` | Display | `label`: string label, `value`: string value. |
| `Data.StatsGrid` | Display | Grid wrapper for metric stats. |
| `Data.Stat` | Display | `label`: metric name, `value`: metric value. |
| `Input.Text` | Input | `label`, `placeholder`, `multiline`: boolean, `inputType`: `"text"` \| `"number"` \| `"email"`. |
| `Input.Select` | Input | `label`, `dataSource`: `{ type: "STATIC" \| "API" \| "VARIABLE", items: [{label, value}] }`. |
| `Input.Checkbox` | Input | `label`: boolean toggle label. |

---

## Interactive Actions & Response Triggers (V3 API)

Interactive actions enable in-chat workflows where clicking a button or submitting form inputs dispatches structured data back to your backend service.

### Triggering an Interactive Action

When a user clicks an action button or submits form data, send an HTTP POST request to record the response and trigger webhooks:

**Endpoint:** `POST /v3/workspaces/:slug/channels/:channelId/messages/:messageId/actions`
**Or Path Parameter Variant:** `POST /v3/workspaces/:slug/channels/:channelId/messages/:messageId/actions/:actionId`
**Required Scope:** `messages:send` or `*`

**Request Body:**
```json
{
  "actionId": "approve",
  "comment": "Deployment verified in staging, approving for prod.",
  "metadata": {
    "environment": "production",
    "formState": {
      "deployment_reason": "Security patch passed QA"
    }
  }
}
```

**Execution Pipeline:**

1. **Validation & Resolution**: Resolves message, user context, and action definition.
2. **Database Logging**: Saves a `MessageActionResponse` entry recording user identity, action selected, comment, and form state.
3. **Webhook Callback Dispatch**: If `callbackUrl` is present in message metadata or action handler, sends an HTTP POST request with HMAC SHA-256 signature (`X-Webhook-Signature`).
4. **Workspace Event Broadcast**: Dispatches a `message.action_response` event to all workspace webhooks registered for the event.
5. **Real-time Sync**: Broadcasts `message.action_response` over Ably / WebSocket to instantly reflect user actions across open clients.
6. **Audit Logging**: Creates a `workspaceAuditLog` entry tracking the action execution for enterprise compliance.

### Fetch Action Responses

Retrieve all recorded user responses and form submissions for a specific message.

**Endpoint:** `GET /v3/workspaces/:slug/channels/:channelId/messages/:messageId/actions`
**Required Scope:** `messages:read` or `*`

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
        "environment": "staging",
        "formState": {
          "deployment_reason": "Approved by release lead"
        }
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

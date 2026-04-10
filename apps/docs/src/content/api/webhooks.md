# Webhooks

Webhooks allow your application to receive real-time notifications when events happen in a workspace.

## Setup

1. **Endpoint**: You must provide a publicly accessible URL that can receive `POST` requests.
2. **Registration**: Currently, webhooks are registered via the workspace settings UI or the API (Beta).

## Event Format

All webhook payloads follow a consistent structure:

```json
{
  "event": "message.sent",
  "workspaceId": "uuid",
  "timestamp": "2023-10-27T10:00:00Z",
  "data": {
    "message": {
      "id": "msg_...",
      "content": "...",
      "userId": "..."
    }
  }
}
```

## Available Events

| Event | Description |
| :--- | :--- |
| `message.sent` | Triggered when a new message is posted. |
| `channel.created` | Triggered when a new channel is created. |
| `member.joined` | Triggered when a new member joins the workspace. |

## Verification

Every webhook request includes a signature header to verify its authenticity.
`X-Signature`: SHA256 HMAC of the payload using your webhook secret.

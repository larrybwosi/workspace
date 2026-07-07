# M2M Integration Guide

Machine-to-Machine (M2M) integration allows your organization's backend systems to interact with the API autonomously. This is ideal for provisioning tenants, sending system updates, and managing bots at scale.

## Getting Started

### 1. Create an M2M Application
Go to your Organization settings and create a new M2M application. You will receive a `client_id` and `client_secret`.

### 2. Obtain an Access Token
Exchange your credentials for a Bearer token using the OAuth2 Client Credentials grant.

**Available Scopes:**
- `provisioning:workspaces`: Create and manage workspaces.
- `messages:read`: Read messages in allowed channels.
- `messages:send`: Send messages and trigger actions.
- `channels:read`: List and view channel details.
- `channels:write`: Create and manage channels.
- `webhooks:read`: View webhook configurations.
- `webhooks:write`: Manage webhooks.

```bash
curl -X POST https://api.yourdomain.com/api/v2/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "client_credentials",
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "scope": "provisioning:workspaces messages:send"
  }'
```

## Provisioning Workspaces

You can provision new workspaces (tenants) for your organization. When a workspace is provisioned via M2M:
1. A **System Bot** (Default Bot) is automatically created with admin privileges.
2. Your M2M application is installed as an **Administrator** in the new workspace.

### System Bot & M2M Messaging
When you send messages or create announcements via M2M, the platform automatically resolves the sender.
- If your M2M application has an associated bot, it will be used as the sender.
- Otherwise, the **System Bot** of the workspace will be used.

This ensures that system-generated content always has a valid bot author, allowing you to send announcements even if you haven't created a custom bot for your M2M application.

```bash
curl -X POST https://api.yourdomain.com/api/v2/provisioning/workspaces \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corp",
    "slug": "acme-corp",
    "ownerEmail": "admin@acme.com",
    "channels": ["general", "engineering"],
    "initialMembers": [
      { "email": "dev@acme.com", "role": "member" }
    ]
  }'
```

### Creating an Announcement via M2M

```bash
curl -X POST https://api.yourdomain.com/v2/workspaces/acme-corp/announcements \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "departmentId": "DEPT_ID",
    "title": "Scheduled Maintenance",
    "content": "System will be down for maintenance on Sunday at 2 AM UTC.",
    "priority": "high"
  }'
```

## Interactive Messages & Actions

M2M applications can send interactive messages with buttons (actions). When a user clicks a button, a callback is sent to your application.

### Sending an Interactive Message

```bash
curl -X POST https://api.yourdomain.com/api/v2/workspaces/acme-corp/messages \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "channelId": "CHANNEL_ID",
    "content": "New deployment requested. Should we proceed?",
    "actions": [
      { "actionId": "deploy_approve", "label": "Approve", "style": "primary" },
      { "actionId": "deploy_reject", "label": "Reject", "style": "danger" }
    ]
  }'
```

### Handling Callbacks

When an action is triggered, Skyrme Chat sends a POST request to your M2M application's `webhookUrl`. You can respond to this request to update the message content.

**Skyrme Response Expectation:**
If you return a JSON body with `content` or `metadata`, the original message will be updated.

```json
{
  "content": "✅ Deployment approved by @user",
  "metadata": { "status": "approved" }
}
```

## Webhooks

M2M applications can subscribe to workspace events to stay in sync.

### Verifying Webhook Signatures

Every webhook request includes an `X-Webhook-Signature` header. You **must** verify this signature to ensure the request came from Skyrme Chat.

```javascript
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}
```

### Event List
- `message.sent`: A new message was posted.
- `message.action`: A user clicked an interactive button.
- `channel.created`: A new channel was added.

## Security Best Practices

- **IP Allowlisting**: Restrict your M2M application to specific IP addresses.
- **Token Management**: Tokens expire after 1 hour. Implement a refresh logic by re-exchanging credentials.
- **Secret Rotation**: Regularly rotate your `client_secret` in the organization settings.
- **Scope Minimization**: Only request the minimum necessary scopes for each task.

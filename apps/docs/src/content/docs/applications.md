# Applications and Bots

Scrymechat's developer platform allows you to build powerful integrations and automated bots that live directly within your workspaces. This guide covers how to create, configure, authenticate, and install applications.

---

## Creating an Application

You can create applications programmatically or via developer settings:

### Via REST API

```bash
curl -X POST https://api.chat.scryme.tech/v3/applications \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Support Bot",
    "description": "Automated customer support assistant",
    "workspaceSlug": "acme-workspace"
  }'
```

---

## Bot Credentials & Authentication

Every application automatically creates an associated **Bot User** equipped with credentials:

- **Client ID**: Public identifier for OAuth and gateway identification.
- **Client Secret**: Private secret used for OAuth `client_credentials` grant flow.
- **Bot Token**: Long-lived authentication token for direct bot operations.

### Making Authenticated API Calls

Include your bot token in request headers:

```bash
# Discord V10 Gateway Compatibility
curl -X POST https://api.chat.scryme.tech/v10/channels/CHANNEL_ID/messages \
  -H "Authorization: Bot YOUR_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello from Acme Support Bot!"}'

# Native V3 API
curl -X GET https://api.chat.scryme.tech/v3/workspaces/acme-workspace/bots \
  -H "Authorization: Bearer YOUR_BOT_TOKEN"
```

---

## Adding a Bot to a Workspace

To enable a bot within a workspace:

### 1. Install Bot to Workspace

```bash
curl -X POST https://api.chat.scryme.tech/v3/applications/APP_ID/install \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceSlug": "acme-workspace"
  }'
```

### 2. Auto-Provisioning Teams & Channels (`channelDefinitions`)

Applications can declare `channelDefinitions` so that installing the bot automatically sets up required workspace channels and team structures:

```json
{
  "name": "DevOps Bot",
  "channelDefinitions": [
    {
      "teamName": "Engineering",
      "channelName": "deployments",
      "teamDescription": "Deployment logs and alerts",
      "icon": "rocket",
      "autoPopulateRoles": ["admin", "owner"]
    }
  ]
}
```

When installed:
- "Engineering" team and "deployments" channel are created if missing.
- The bot is added as an administrator and channel owner.
- Users with `admin` or `owner` roles are automatically added to the channel.

---

## Managing Applications

- **List Applications**: `GET /v3/applications`
- **Get Application**: `GET /v3/applications/:id`
- **Update Application**: `PATCH /v3/applications/:id`
- **Reset Bot Token**: `POST /v3/applications/:id/reset-token`
- **Delete Application**: `DELETE /v3/applications/:id`
- **List Workspace Bots**: `GET /v3/workspaces/:slug/bots`

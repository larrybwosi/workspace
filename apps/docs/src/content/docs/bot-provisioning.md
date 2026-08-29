# Bot Provisioning & Management

Your M2M integration and developer applications can seamlessly provision and manage custom bots for your tenants. This allows for specialized integrations tailored to each workspace.

## System Bot (Default)

Every workspace provisioned via the M2M API automatically includes a **System Bot**.
- **Name:** System Bot
- **Role:** Workspace Admin
- **Purpose:** Handles system-wide announcements, automated onboarding, and acts as the default sender for M2M integrations that do not have their own dedicated bot.

---

## Step 1: Creating a Bot Application

To create a new bot specifically for a workspace or tenant, use the V3 Applications API:

```bash
curl -X POST https://api.chat.scryme.tech/v3/applications \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Support Bot",
    "description": "Handles support tickets and customer notifications",
    "workspaceSlug": "acme-corp"
  }'
```

### Response Example

```json
{
  "id": "app_cli12345678",
  "name": "Support Bot",
  "description": "Handles support tickets and customer notifications",
  "clientId": "app_a1b2c3d4e5f6",
  "clientSecret": "8f3e2a1b4c...",
  "workspaceId": "ws_acme123",
  "ownerId": "user_owner123",
  "bot": {
    "id": "bot_9876543210",
    "name": "Support Bot",
    "botToken": "Ym90Xzk4NzY1NDMyMTA.1740825600000.signatureHash..."
  },
  "createdAt": "2026-08-29T10:00:00.000Z"
}
```

---

## Step 2: How to Add / Install a Bot to a Workspace

A bot can be installed into a workspace programmatically or directly via workspace administration.

### Method A: Via Applications Installation Endpoint

To install an existing bot application into a new or additional workspace:

```bash
curl -X POST https://api.chat.scryme.tech/v3/applications/APP_ID/install \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceSlug": "target-workspace-slug"
  }'
```

### Method B: Via Workspace Bots Endpoint

Workspace administrators can also add a bot directly from workspace settings:

```bash
curl -X POST https://api.chat.scryme.tech/v3/workspaces/target-workspace-slug/bots \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "applicationId": "APP_ID"
  }'
```

### Listing Installed Workspace Bots

To verify which bots are installed in a workspace:

```bash
curl -X GET https://api.chat.scryme.tech/v3/workspaces/target-workspace-slug/bots \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Automated Channel & Team Provisioning (`channelDefinitions`)

When creating or updating an application, you can specify `channelDefinitions`. When the bot is installed into any workspace, Scrymechat automatically provisions the required teams and channels and configures membership:

```json
{
  "name": "Incident Alert Bot",
  "channelDefinitions": [
    {
      "teamName": "Operations",
      "channelName": "incident-alerts",
      "teamDescription": "Managed by Incident Alert Bot",
      "icon": "bell",
      "autoPopulateRoles": ["admin", "owner"]
    }
  ]
}
```

### What Happens During Installation:
1. **Team Creation**: If the "Operations" team does not exist in the target workspace, it is created automatically with the bot set as the team lead.
2. **Channel Creation**: If the "incident-alerts" channel does not exist, it is created and linked to the "Operations" team.
3. **Bot Membership**: The bot is automatically added to both the workspace and channel membership.
4. **Member Auto-Population**: Workspace members with roles matching `autoPopulateRoles` (e.g. `admin` and `owner`) are automatically added to the provisioned channel.

---

## Step 3: Authenticating as the Bot

Your bot authenticates using its long-lived `botToken` generated during creation.

Pass the token in the `Authorization` header:

```bash
curl -X POST https://api.chat.scryme.tech/v10/channels/CHANNEL_ID/messages \
  -H "Authorization: Bot YOUR_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello! Support Bot is online and ready to assist."
  }'
```

Alternatively, standard Bearer authentication is supported for V3 API routes:
`Authorization: Bearer YOUR_BOT_TOKEN`

---

## Resetting Bot Token

If your bot token is leaked or compromised, regenerate it immediately:

```bash
curl -X POST https://api.chat.scryme.tech/v3/applications/APP_ID/reset-token \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Bot Interactions & Slash Commands

Register custom slash commands for your bot:

```bash
curl -X POST https://api.chat.scryme.tech/bot/v10/applications/APP_ID/commands \
  -H "Authorization: Bot YOUR_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "status",
    "description": "Check status of system services",
    "options": [
      {
        "name": "service",
        "description": "Name of service",
        "type": 3,
        "required": true
      }
    ]
  }'
```

When a user invokes `/status`, Scrymechat delivers the interaction payload to your configured `interactionsUrl`.

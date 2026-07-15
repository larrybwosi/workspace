# Bot Provisioning & Management

Your M2M application can seamlessly provision and manage custom bots for your tenants. This allows for specialized integrations tailored to each workspace.

## System Bot (Default)

Every workspace provisioned via the M2M API automatically includes a **System Bot**.
- **Name:** System Bot
- **Role:** Workspace Admin
- **Purpose:** Handles system-wide announcements, automated onboarding, and acts as the default sender for M2M integrations that do not have their own dedicated bot.

## Creating a Bot for a Workspace

To create a new bot specifically for a tenant's workspace, use the Applications API:

```bash
curl -X POST https://api.yourdomain.com/v2/applications \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Custom Support Bot",
    "description": "Handles support tickets for Tenant A",
    "workspaceId": "WORKSPACE_ID"
  }'
```

## Managing Bot Commands

You can define slash commands that your bot will respond to. Commands can be global or workspace-specific.

```bash
curl -X POST https://api.yourdomain.com/v2/applications/BOT_ID/commands \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "status",
    "description": "Check the status of your support ticket",
    "options": [
      {
        "name": "ticket_id",
        "description": "The ID of your ticket",
        "type": 3,
        "required": true
      }
    ]
  }'
```

## Automating Bot Installation

Bots created by M2M applications for a specific `workspaceId` are automatically "installed" into that workspace. If you want to install a bot into another workspace within your organization:

```bash
curl -X POST https://api.yourdomain.com/v2/applications/BOT_ID/install \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "ANOTHER_WORKSPACE_ID"
  }'
```

## Bot Interactions

When a user interacts with your bot (e.g., uses a slash command), the platform will send a POST request to your configured `interactionsUrl`. Your backend should handle these requests and respond with the appropriate actions.

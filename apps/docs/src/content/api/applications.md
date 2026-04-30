# Bot Applications

Bot Applications are the foundation for building integrations with Skyrme Chat. They provide the necessary credentials to authenticate with the API and interact with workspaces.

## Creating an Application

You can manage your bot applications via the Developer Portal in your Skyrme Chat account.

**Endpoint:** `POST /v2/applications`

### Bot Token vs OAuth
- **Bot Token**: A long-lived token used by the bot user itself to authenticate.
- **Client ID / Secret**: Used in the OAuth2 flow to obtain a short-lived access token.

## Installation

A bot must be "installed" into a workspace before it can access its resources. Installation creates a bot user member within that workspace.

**Endpoint:** `POST /v2/applications/:id/install`

### Channel Definitions

When defining an application, you can specify `channelDefinitions`. These are infrastructure requirements that Skyrme Chat will automatically provision when the bot is installed:

```json
{
  "channelDefinitions": [
    {
      "teamName": "Operations",
      "channelName": "alerts",
      "teamDescription": "Managed by AlertBot",
      "icon": "bell",
      "autoPopulateRoles": ["admin"]
    }
  ]
}
```

- **Provisioning**: Skyrme Chat will ensure the "Operations" team and "alerts" channel exist.
- **Membership**: The bot will be added as a lead/owner of these resources.
- **Auto-populate**: Users with the `admin` role in the workspace will be automatically added to the new team/channel.

## Technical Details

For detailed schema info, see the [API Explorer](/api-reference/explorer#bot-applications).

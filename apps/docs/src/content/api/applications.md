# Bot Applications

Bot Applications are the foundation for building integrations with Scrymechat. They provide the necessary credentials to authenticate with the API and interact with workspaces.

## Creating an Application

You can manage your bot applications via the Developer Portal in your Scrymechat account or programmatically via the API.

**Endpoint:** `POST /v2/applications`

**Body:**

```json
{
  "name": "My New Bot",
  "description": "A helpful assistant bot"
}
```

---

## Managing Applications

### List Applications

Returns a list of all bot applications owned by the authenticated user.

**Endpoint:** `GET /v2/applications`

---

### Get Application Details

Retrieve detailed information about a specific bot application.

**Endpoint:** `GET /v2/applications/:id`

---

### Update Application

Update the name, description, or channel definitions for an application.

**Endpoint:** `POST /v2/applications/:id`

**Body:**

```json
{
  "name": "Updated Bot Name",
  "description": "New description"
}
```

---

### Reset Bot Token

Revokes the current bot token and generates a new one. Use this if your token has been compromised.

**Endpoint:** `POST /v2/applications/:id/reset-token`

---

### Delete Application

Permanently deletes the bot application and its associated bot user.

**Endpoint:** `POST /v2/applications/:id/delete`

### Bot Token vs OAuth

- **Bot Token**: A long-lived token used by the bot user itself to authenticate.
- **Client ID / Secret**: Used in the OAuth2 flow to obtain a short-lived access token.

## Installation

A bot must be "installed" into a workspace before it can access its resources. Installation creates a bot user member within that workspace.

**Endpoint:** `POST /v2/applications/:id/install`

**Body:**

```json
{
  "workspaceId": "workspace_id_here"
}
```

### Channel Definitions

When defining an application, you can specify `channelDefinitions`. These are infrastructure requirements that Scrymechat will automatically provision when the bot is installed:

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

- **Provisioning**: Scrymechat will ensure the "Operations" team and "alerts" channel exist.
- **Membership**: The bot will be added as a lead/owner of these resources.
- **Auto-populate**: Users with the `admin` role in the workspace will be automatically added to the new team/channel.

## Technical Details

For detailed schema info, see the [API Explorer](/api-reference/explorer#bot-applications).

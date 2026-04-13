# Applications and Bots

Skryme's developer platform allows you to build powerful integrations and automated bots that live directly within your workspaces. This guide covers how to create, configure, and manage your applications.

## Creating an Application

To start building on Skryme, you first need to create an application in the [Developer Portal](/developer).

1. Navigate to the **Dashboard** in the Developer Portal.
2. Click on **New Application**.
3. Provide a name and a brief description for your bot.
4. Click **Create Application**.

Once created, you will be redirected to the application's configuration page.

## Bot Identity

Every application is associated with a **Bot User**. You can customize your bot's identity to make it recognizable to your users.

- **Bot Name**: This is the display name of your bot in chat.
- **Bot Avatar**: Upload an icon that represents your application.

## Authentication & Security

### Bot Token

Your **Bot Token** is the primary way your application authenticates with the Skryme API.

:::warning
**Keep your Bot Token secret.** Never share it on client-side code, public repositories (like GitHub), or in insecure environments. If you suspect your token has been compromised, use the **Revoke Bot Token** button in the configuration page immediately.
:::

### Client ID

The **Client ID** is a public identifier for your application, used during the OAuth2 flow to identify your app to users and workspaces.

## Scopes and Permissions

To interact with workspaces, your bot needs specific permissions.

- **Scopes**: These define what your application can do (e.g., `bot`, `identify`, `messages.read`).
- **Permissions**: These are granular chat permissions (e.g., `Send Messages`, `Manage Channels`) that your bot will have once invited to a guild or channel.

Use the **Permissions Calculator** in the configuration page to generate the correct permission integer for your invitation links.

## Installation

You can configure how users can install your application:

- **Guild Install**: Allows administrators to add your bot to an entire workspace.
- **User Install**: Allows individuals to add your bot functionality to their own profile for use across different contexts.

## Next Steps

Once your bot is configured, you can start using our [API Reference](/api/overview) to send messages, handle webhooks, and listen for real-time events.

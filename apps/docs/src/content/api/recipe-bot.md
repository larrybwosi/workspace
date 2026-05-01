# How to Build a Bot

Building a bot for Skyrme Chat is simple and powerful. You can choose between using our native **V2 REST API** with Webhooks/Ably, or our **Discord V10 Compatibility Layer**.

## Native V2 API (Recommended)

The V2 API is designed specifically for Skyrme Chat features like Workspaces, Teams, and Departments.

### 1. Create a Bot Application
Go to your **Workspace Settings > Developer Portal** and create a new application. Copy your **Client ID** and **Client Secret**.

### 2. Authenticate
Use the `client_credentials` flow to get an access token.

```bash
curl -X POST https://api.skyrme.chat/v2/oauth/token \
  -d '{"grant_type":"client_credentials","client_id":"...","client_secret":"..."}'
```

### 3. Handle Events
You have two options for receiving real-time events:

- **Webhooks**: Provide a URL and we'll POST events to it. Best for serverless or PHP/Ruby/Python backends.
- **Ably (WebSockets)**: Connect to our Ably integration for a persistent socket connection. Best for Node.js or high-frequency interactions.

### 4. Respond to Messages
Use the messages endpoint to send replies.

```bash
curl -X POST https://api.skyrme.chat/v2/workspaces/my-workspace/channels/general/messages \
  -H "Authorization: Bearer <token>" \
  -d '{"content": "Hello from my bot!"}'
```

## Discord Compatibility Layer

If you already have a Discord bot or prefer using Discord libraries like `discord.js`, you can use our V10 Gateway.

1. **Get your Bot Token**: In the Developer Portal, generate a Bot Token for your application.
2. **Configure Library**: Point your library's API and Gateway base URLs to `api.skyrme.chat/v10`.
3. **Run your Code**: Your bot will behave just like it's on Discord!

---

## Bot Capabilities

Bots in Skyrme Chat can do more than just chat:

- **Infrastructure Management**: Bots can be configured with `channelDefinitions` to automatically create the necessary teams and channels when they are installed in a workspace.
- **Slash Commands**: Register custom commands that appear in the chat input (e.g., `/jira create`).
- **Interactive Buttons**: Send messages with buttons that trigger custom actions in your backend.
- **File Processing**: Bots can upload and receive files, including images and documents.

## Example: Recipe Bot

Check out our [Recipe Bot guide](/api-reference/recipe-bot) to see a complete example of a bot that fetches and shares recipes in chat.

# Discord V10 Gateway

Scrymechat provides a compatibility layer for the Discord V10 Gateway protocol. This allows you to use standard Discord libraries (like `discord.js` or `discord.py`) to build bots for Scrymechat.

## Gateway URL

Connect your Discord library to the following WebSocket endpoint:

`ws://api.skyrme.chat/v10/gateway`

## Supported Opcodes

| Opcode | Name      | Description                                      |
| :----- | :-------- | :----------------------------------------------- |
| `0`    | Dispatch  | An event was dispatched.                         |
| `1`    | Heartbeat | Used for client-side heartbeat.                  |
| `2`    | Identify  | Used for client-side handshake.                  |
| `10`   | Hello     | Sent by the server immediately after connecting. |

## Supported Dispatch Events

Scrymechat currently supports the following gateway events:

- `READY`: Dispatched when the handshake is successful.
- `MESSAGE_CREATE`: Dispatched when a message is sent in a channel.
- `MESSAGE_UPDATE`: Dispatched when a message is edited.
- `MESSAGE_DELETE`: Dispatched when a message is deleted.
- `INTERACTION_CREATE`: Dispatched when a slash command is used.

## Authentication

When using a Discord library, use your **Bot Token** as the "Discord Bot Token".

### discord.js Example

```javascript
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  // Override the base API and Gateway URLs
  rest: { api: 'https://api.skyrme.chat/v10' },
  ws: { gateway: 'ws://api.skyrme.chat/v10/gateway' },
});

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', msg => {
  if (msg.content === 'ping') {
    msg.reply('pong');
  }
});

client.login('your_bot_token');
```

## Mapping Concepts

- **Guilds** in Discord map to **Workspaces** in Scrymechat.
- **Roles** map to Scrymechat roles (Owner, Admin, Member).
- **Snowflakes**: Scrymechat uses standard UUIDs, but for compatibility, some fields are translated to Discord-style snowflakes.

### Role Snowflakes

- Owner: `100000000000000001`
- Admin: `100000000000000002`
- Member: `100000000000000003`

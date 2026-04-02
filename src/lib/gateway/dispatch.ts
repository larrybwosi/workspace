import { GatewayOpcode } from "./types";

/**
 * Dispatches a MESSAGE_CREATE event to a bot via WebSocket.
 * Maps internal message objects to Discord format.
 */
export function dispatchMessageCreate(ws: any, message: any, sequence: number) {
  const payload = {
    op: GatewayOpcode.Dispatch,
    s: sequence,
    t: "MESSAGE_CREATE",
    d: {
      id: message.id,
      channel_id: message.channelId,
      guild_id: message.channel?.workspaceId || null,
      author: {
        id: message.user.id,
        username: message.user.name,
        avatar: message.user.avatar,
        bot: message.user.isBot || false,
        discriminator: "0000",
        public_flags: 0,
        flags: 0,
        banner: null,
        accent_color: null,
        global_name: message.user.name,
        avatar_decoration_data: null,
        banner_color: null,
      },
      content: message.content,
      timestamp: message.timestamp.toISOString(),
      edited_timestamp: message.isEdited ? message.updatedAt.toISOString() : null,
      tts: false,
      mention_everyone: false,
      mentions: [],
      mention_roles: [],
      mention_channels: [],
      attachments: [],
      embeds: message.metadata?.embeds || [],
      reactions: [],
      nonce: null,
      pinned: false,
      webhook_id: null,
      type: 0,
      activity: null,
      application: null,
      application_id: null,
      message_reference: message.metadata?.referencedMessage ? {
        message_id: message.metadata.referencedMessage,
        channel_id: message.channelId,
        guild_id: message.channel?.workspaceId
      } : null,
      flags: 0,
      referenced_message: null,
      interaction_metadata: null,
      interaction: null,
      thread: null,
      components: message.metadata?.components || [],
      sticker_items: [],
      stickers: [],
      position: 0,
      role_subscription_data: null,
      resolved: null,
    }
  };

  ws.send(JSON.stringify(payload));
}

/**
 * Dispatches a MESSAGE_UPDATE event.
 */
export function dispatchMessageUpdate(ws: any, message: any, sequence: number) {
  const payload = {
    op: GatewayOpcode.Dispatch,
    s: sequence,
    t: "MESSAGE_UPDATE",
    d: {
      id: message.id,
      channel_id: message.channelId,
      content: message.content,
      edited_timestamp: message.updatedAt.toISOString(),
      // ... only changed fields ...
    }
  };
  ws.send(JSON.stringify(payload));
}

/**
 * Dispatches a MESSAGE_DELETE event.
 */
export function dispatchMessageDelete(ws: any, messageId: string, channelId: string, guildId: string | null, sequence: number) {
  const payload = {
    op: GatewayOpcode.Dispatch,
    s: sequence,
    t: "MESSAGE_DELETE",
    d: {
      id: messageId,
      channel_id: channelId,
      guild_id: guildId
    }
  };
  ws.send(JSON.stringify(payload));
}

/**
 * Dispatches a GUILD_CREATE event to a bot.
 */
export function dispatchGuildCreate(ws: any, workspace: any, sequence: number) {
  const payload = {
    op: GatewayOpcode.Dispatch,
    s: sequence,
    t: "GUILD_CREATE",
    d: {
      id: workspace.id,
      name: workspace.name,
      icon: workspace.icon,
      owner_id: workspace.ownerId,
      // ... more guild data ...
      channels: workspace.channels.map((c: any) => ({
        id: c.id,
        name: c.name,
        type: c.type === "channel" ? 0 : 4 // Simplified mapping
      })),
      members: [],
      roles: []
    }
  };

  ws.send(JSON.stringify(payload));
}

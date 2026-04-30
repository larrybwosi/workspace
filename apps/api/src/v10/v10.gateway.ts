import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'ws';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { prisma } from '@repo/database';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { AblyEvents } from '@repo/shared/server';
import * as Ably from 'ably';

@WebSocketGateway({
  path: '/v10/gateway',
})
@Injectable()
export class V10Gateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(V10Gateway.name);
  private sessions = new Map<any, { botId: string; authenticated: boolean }>();
  private botToSockets = new Map<string, Set<any>>();
  private ably: Ably.Realtime;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const ablyKey = this.configService.get<string>('ABLY_API_KEY');
    if (ablyKey) {
      this.ably = new Ably.Realtime({ key: ablyKey });
      this.subscribeToGlobalEvents();
    }
  }

  private subscribeToGlobalEvents() {
    const channel = this.ably.channels.get('global-system-events');
    channel.subscribe((message) => {
      const { name, data } = message;
      this.handleSystemEvent(name, data);
    });
  }

  private async handleSystemEvent(name: string, data: any) {
    switch (name) {
      case AblyEvents.MESSAGE_SENT:
        await this.dispatchMessageCreated(data.message);
        break;
      case AblyEvents.MESSAGE_UPDATED:
        await this.dispatchMessageUpdated(data.message);
        break;
      case AblyEvents.MESSAGE_DELETED:
        await this.dispatchMessageDeleted(data);
        break;
      case 'INTERACTION_CREATE':
        await this.dispatchInteractionCreated(data);
        break;
    }
  }

  private async dispatchMessageCreated(message: any) {
    const channel = await prisma.channel.findUnique({
      where: { id: message.channelId },
      select: { workspaceId: true },
    });

    if (channel?.workspaceId) {
      const bots = await prisma.workspaceMember.findMany({
        where: { workspaceId: channel.workspaceId, user: { isBot: true } },
        select: { userId: true },
      });

      const discordMessage = {
        id: message.id,
        channel_id: message.channelId,
        guild_id: channel.workspaceId,
        author: {
          id: message.userId,
          username: message.user?.name || 'Unknown',
          avatar: message.user?.avatar,
          bot: message.user?.isBot || false,
        },
        content: message.content,
        timestamp: message.timestamp,
        edited_timestamp: null,
        tts: false,
        mention_everyone: false,
        mentions: [],
        mention_roles: [],
        mention_channels: [],
        attachments: [],
        embeds: message.metadata?.embeds || [],
        reactions: [],
        pinned: false,
        type: 0,
      };

      for (const bot of bots) {
        if (bot.userId === message.userId) continue;
        this.dispatch(bot.userId, 'MESSAGE_CREATE', discordMessage);
      }
    }
  }

  private async dispatchMessageUpdated(message: any) {
    const channel = await prisma.channel.findUnique({
      where: { id: message.channelId },
      select: { workspaceId: true },
    });

    if (channel?.workspaceId) {
      const bots = await prisma.workspaceMember.findMany({
        where: { workspaceId: channel.workspaceId, user: { isBot: true } },
        select: { userId: true },
      });

      const discordMessage = {
        id: message.id,
        channel_id: message.channelId,
        guild_id: channel.workspaceId,
        author: {
          id: message.userId,
          username: message.user?.name || 'Unknown',
          avatar: message.user?.avatar,
          bot: message.user?.isBot || false,
        },
        content: message.content,
        timestamp: message.timestamp,
        edited_timestamp: message.updatedAt,
        tts: false,
        mention_everyone: false,
        mentions: [],
        mention_roles: [],
        mention_channels: [],
        attachments: [],
        embeds: message.metadata?.embeds || [],
        reactions: [],
        pinned: false,
        type: 0,
      };

      for (const bot of bots) {
        if (bot.userId === message.userId) continue;
        this.dispatch(bot.userId, 'MESSAGE_UPDATE', discordMessage);
      }
    }
  }

  private async dispatchInteractionCreated(interaction: any) {
    const botId = interaction.token.split('.')[0];
    this.dispatch(botId, 'INTERACTION_CREATE', interaction);
  }

  private async dispatchMessageDeleted(data: any) {
    const { messageId, channelId } = data;
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      select: { workspaceId: true },
    });

    if (channel?.workspaceId) {
      const bots = await prisma.workspaceMember.findMany({
        where: { workspaceId: channel.workspaceId, user: { isBot: true } },
        select: { userId: true },
      });

      for (const bot of bots) {
        this.dispatch(bot.userId, 'MESSAGE_DELETE', {
          id: messageId,
          channel_id: channelId,
          guild_id: channel.workspaceId,
        });
      }
    }
  }

  handleConnection(client: any) {
    this.logger.log(`Client connected`);

    client.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        this.handleOp(client, data);
      } catch (e) {
        this.logger.error('Failed to parse gateway message', e);
      }
    });

    // Discord sends "Hello" on connection
    this.sendOp(client, 10, {
      heartbeat_interval: 41250,
    });
  }

  handleDisconnect(client: any) {
    this.logger.log(`Client disconnected`);
    const session = this.sessions.get(client);
    if (session) {
      const sockets = this.botToSockets.get(session.botId);
      if (sockets) {
        sockets.delete(client);
        if (sockets.size === 0) this.botToSockets.delete(session.botId);
      }
      this.sessions.delete(client);
    }
  }

  private sendOp(client: any, op: number, d?: any, t?: string, s?: number) {
    if (client.readyState === 1) { // OPEN
      client.send(JSON.stringify({ op, d, t, s }));
    }
  }

  async handleOp(client: any, data: any) {
    const { op, d } = data;

    switch (op) {
      case 2: // Identify
        await this.handleIdentify(client, d);
        break;
      case 1: // Heartbeat
        this.sendOp(client, 11); // Heartbeat ACK
        break;
      default:
        this.logger.warn(`Unhandled Opcode: ${op}`);
    }
  }

  private async handleIdentify(client: any, data: any) {
    const { token } = data;

    const botId = this.validateBotToken(token);
    if (!botId) {
      this.sendOp(client, 9, false); // Invalid Session
      client.close();
      return;
    }

    const bot = await prisma.user.findFirst({
      where: { id: botId, isBot: true, botToken: token },
    });

    if (!bot) {
      this.sendOp(client, 9, false); // Invalid Session
      client.close();
      return;
    }

    this.sessions.set(client, { botId: bot.id, authenticated: true });

    let sockets = this.botToSockets.get(bot.id);
    if (!sockets) {
      sockets = new Set();
      this.botToSockets.set(bot.id, sockets);
    }
    sockets.add(client);

    // Send READY event
    this.sendOp(client, 0, {
      v: 10,
      user: {
        id: bot.id,
        username: bot.name,
        discriminator: '0000',
        avatar: bot.avatar,
        bot: true,
      },
      guilds: [],
      session_id: crypto.randomBytes(16).toString('hex'),
    }, 'READY', 1);

    this.logger.log(`Bot ${bot.name} (${bot.id}) identified successfully`);
  }

  private validateBotToken(token: string): string | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const [base64Id, timestamp, signature] = parts;

      const expectedSignature = crypto
        .createHmac('sha256', process.env.BOT_TOKEN_SECRET || 'default_secret')
        .update(`${base64Id}.${timestamp}`)
        .digest('base64url');

      if (signature !== expectedSignature) return null;

      const userId = Buffer.from(base64Id, 'base64').toString('utf-8');
      return userId;
    } catch (error) {
      return null;
    }
  }

  dispatch(botId: string, event: string, data: any) {
    const sockets = this.botToSockets.get(botId);
    if (sockets) {
      for (const socket of sockets) {
        this.sendOp(socket, 0, data, event);
      }
    }
  }
}

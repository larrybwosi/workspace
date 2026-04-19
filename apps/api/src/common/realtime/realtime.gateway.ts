import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { auth } from '../../auth/better-auth';
import { setSocketioProvider, RealtimeProvider } from '@repo/shared/server';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3001',
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, RealtimeProvider
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('RealtimeGateway');
  private presenceMap: Map<string, Map<string, any>> = new Map(); // channel -> userId -> data

  afterInit(server: Server) {
    this.logger.log('Realtime Gateway Initialized');
    setSocketioProvider(this);
  }

  async handleConnection(client: Socket) {
    try {
      // Socket.io authentication using better-auth
      // We expect the session cookie or authorization header to be present in the handshake
      const session = await auth.api.getSession({
        headers: client.handshake.headers as any,
      });

      if (!session) {
        this.logger.log(`Unauthorized connection attempt: ${client.id}`);
        client.disconnect();
        return;
      }

      const userId = session.user.id;
      (client as any).user = session.user;

      // Join user-specific rooms
      client.join(`user:${userId}`);
      client.join(`notifications:${userId}`);

      this.logger.log(`Client connected: ${client.id} (User: ${userId})`);

      // Handle joining specific rooms (channels, workspaces, etc.)
      client.on('join-room', async (room: string) => {
        const user = (client as any).user;
        if (!user) return;

        // Basic permission check
        let allowed = false;

        if (room.startsWith('user:') || room.startsWith('notifications:')) {
          allowed = room.endsWith(user.id);
        } else if (room === 'global-presence') {
          allowed = true;
        } else if (room.startsWith('call-chat:')) {
          allowed = true;
        } else {
          // For other rooms, we'll allow it for now but log it
          allowed = true;
        }

        if (allowed) {
          client.join(room);
          this.logger.log(`Client ${client.id} joined room: ${room}`);
        } else {
          this.logger.warn(`User ${user.id} attempted to join unauthorized room: ${room}`);
        }
      });

      client.on('leave-room', (room: string) => {
        client.leave(room);
        this.logger.log(`Client ${client.id} left room: ${room}`);
      });

      client.on('enter-presence', (data: { channel: string; userId: string; data?: any }) => {
        this.logger.log(`User ${data.userId} entering presence for ${data.channel}`);

        if (!this.presenceMap.has(data.channel)) {
          this.presenceMap.set(data.channel, new Map());
        }
        this.presenceMap.get(data.channel)!.set(data.userId, data.data || {});

        this.server.to(data.channel).emit('presence:enter', { userId: data.userId, data: data.data });
      });

      client.on('leave-presence', (data: { channel: string; userId: string }) => {
        this.logger.log(`User ${data.userId} leaving presence for ${data.channel}`);

        if (this.presenceMap.has(data.channel)) {
          this.presenceMap.get(data.channel)!.delete(data.userId);
        }

        this.server.to(data.channel).emit('presence:leave', { userId: data.userId });
      });

      client.on('get-presence', (data: { channel: string }, callback: (presence: any[]) => void) => {
        const channelPresence = this.presenceMap.get(data.channel);
        const presenceArray = channelPresence
          ? Array.from(channelPresence.entries()).map(([userId, data]) => ({ userId, data }))
          : [];
        callback(presenceArray);
      });
    } catch (error: any) {
      this.logger.error(`Connection error: ${error?.message || 'Unknown error'}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const user = (client as any).user;
    if (user) {
      // Cleanup presence for this user across all channels
      for (const [channel, presence] of this.presenceMap.entries()) {
        if (presence.has(user.id)) {
          presence.delete(user.id);
          this.server.to(channel).emit('presence:leave', { userId: user.id });
        }
      }
    }
  }

  async publish(channel: string, event: string, data: any): Promise<void> {
    this.logger.log(`Publishing to ${channel}: ${event}`);
    const payload = typeof data === 'object' && data !== null ? { ...data, _channel: channel } : data;
    this.server.to(channel).emit(event, payload);
  }

  @SubscribeMessage('publish')
  async handlePublish(client: Socket, payload: { channel: string; event: string; data: any }) {
    const user = (client as any).user;
    if (!user) return;

    if (!payload.channel.startsWith('call-chat:')) {
      this.logger.warn(`User ${user.id} tried to publish to unauthorized channel: ${payload.channel}`);
      return;
    }

    this.logger.log(`Client ${client.id} publishing to ${payload.channel}: ${payload.event}`);
    await this.publish(payload.channel, payload.event, payload.data);
  }
}

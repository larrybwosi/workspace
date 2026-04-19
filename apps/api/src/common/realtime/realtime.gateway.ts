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
      client.on('join-room', (room: string) => {
        // TODO: Add permission check before allowing to join a room
        client.join(room);
        this.logger.log(`Client ${client.id} joined room: ${room}`);
      });

      client.on('leave-room', (room: string) => {
        client.leave(room);
        this.logger.log(`Client ${client.id} left room: ${room}`);
      });

      client.on('enter-presence', (data: { channel: string; userId: string; data?: any }) => {
        this.logger.log(`User ${data.userId} entering presence for ${data.channel}`);
        this.server.to(data.channel).emit('presence:enter', { userId: data.userId, data: data.data });
      });

      client.on('leave-presence', (data: { channel: string; userId: string }) => {
        this.logger.log(`User ${data.userId} leaving presence for ${data.channel}`);
        this.server.to(data.channel).emit('presence:leave', { userId: data.userId });
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
    // Inject the channel name so the client can filter if necessary
    const payload = typeof data === 'object' && data !== null ? { ...data, _channel: channel } : data;
    this.server.to(channel).emit(event, payload);
  }

  // Handle publishing from the client
  @SubscribeMessage('publish')
  async handlePublish(client: Socket, payload: { channel: string; event: string; data: any }) {
    const user = (client as any).user;
    if (!user) return;

    // Security: Only allow publishing to specific non-sensitive channels for now
    // In a real app, this should be much more granular
    if (!payload.channel.startsWith('call-chat:')) {
      this.logger.warn(`User ${user.id} tried to publish to unauthorized channel: ${payload.channel}`);
      return;
    }

    this.logger.log(`Client ${client.id} publishing to ${payload.channel}: ${payload.event}`);
    await this.publish(payload.channel, payload.event, payload.data);
  }
}

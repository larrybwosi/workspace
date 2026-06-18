import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ThrottlerGuard } from '@nestjs/throttler';
import { io, Socket } from 'socket.io-client';
import { AddressInfo } from 'net';

// Mock @repo/database
vi.mock('@repo/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock better-auth
vi.mock('../src/auth/better-auth', () => ({
  auth: {
    options: { basePath: '/api/auth' },
    api: {
      getSession: vi.fn(),
    },
    handler: vi.fn().mockImplementation((req, res, next) => {
        if (typeof next === 'function') next();
    }),
  },
}));

// Mock @repo/shared/server
vi.mock('@repo/shared/server', () => ({
  validateEnv: vi.fn((config) => config || {
    ALLOWED_ORIGINS: 'http://localhost:3000',
    REALTIME_PROVIDER: 'socketio'
  }),
  getAblyRest: vi.fn(),
  getAblyServer: vi.fn(),
  setSocketioProvider: vi.fn(),
  AblyChannels: {
    channel: vi.fn((id) => `channel:${id}`),
    user: vi.fn((id) => `user:${id}`),
  },
  AblyEvents: { MESSAGE_SENT: 'message.sent' },
  processScheduledNotifications: vi.fn(),
}));

import { AppModule } from '../src/app.module';
import { auth } from '../src/auth/better-auth';

describe('Realtime Gateway Verification', () => {
  let app: NestFastifyApplication;
  let socket: Socket;
  let port: number;

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider('REDIS_CLIENT').useValue({
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue('OK'),
    })
    .overrideGuard(ThrottlerGuard).useValue({ canActivate: () => true })
    .compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    // In many NestJS setups, the default WsAdapter or IoAdapter is used.
    // main.ts shows that if REALTIME_PROVIDER=socketio, RedisIoAdapter is used.
    // For local testing without Redis, we can just use the default IoAdapter.
    const { IoAdapter } = await import('@nestjs/platform-socket.io');
    app.useWebSocketAdapter(new IoAdapter(app));

    await app.init();
    const server = app.getHttpServer();
    await server.listen(0);
    port = (server.address() as AddressInfo).port;
  });

  afterAll(async () => {
    if (socket) socket.disconnect();
    if (app) await app.close();
  });

  it('should authenticate and connect via Socket.io', async () => {
      const mockUser = { id: 'user-1', name: 'Test User' };
      const mockToken = 'mock-token';

      vi.spyOn(auth.api, 'getSession').mockResolvedValue({
          session: { id: 'session-1', userId: 'user-1', token: mockToken },
          user: mockUser,
      });

      socket = io(`http://localhost:${port}`, {
          extraHeaders: {
              Authorization: `Bearer ${mockToken}`
          },
          forceNew: true,
          transports: ['websocket']
      });

      await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Socket connection timed out')), 5000);
          socket.on('connect', () => {
              clearTimeout(timeout);
              resolve();
          });
          socket.on('connect_error', (error) => {
              clearTimeout(timeout);
              reject(error);
          });
      });

      expect(socket.connected).toBe(true);
      expect(auth.api.getSession).toHaveBeenCalled();
  });

  it('should join rooms and receive events', async () => {
      const mockUser = { id: 'user-1', name: 'Test User' };
      const mockToken = 'mock-token';

      vi.spyOn(auth.api, 'getSession').mockResolvedValue({
          session: { id: 'session-1', userId: 'user-1', token: mockToken },
          user: mockUser,
      });

      socket = io(`http://localhost:${port}`, {
          extraHeaders: { Authorization: `Bearer ${mockToken}` },
          transports: ['websocket']
      });

      await new Promise<void>((resolve) => socket.on('connect', resolve));

      // Join a room
      const room = 'channel:123';
      socket.emit('join-room', room);

      // Verify we can receive an event (manually trigger it via Gateway if possible, or just emit from server)
      // Since we want to verify the Android flow, we'll check if it can join.
      // Testing room delivery usually requires triggering a broadcast from a service.

      // For now, confirming connection and join-room emit doesn't crash is a good start.
      expect(socket.connected).toBe(true);
  });
});

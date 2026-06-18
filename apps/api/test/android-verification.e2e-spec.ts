import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { ThrottlerGuard } from '@nestjs/throttler';

// Mock @repo/database BEFORE importing AppModule
vi.mock('@repo/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
    session: {
      findUnique: vi.fn(),
    },
    workspace: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    workspaceMember: {
        findUnique: vi.fn(),
    },
    channel: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    channelMember: {
        findUnique: vi.fn(),
    },
    sharedChannel: {
        findFirst: vi.fn(),
    },
    message: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    messageRead: {
      createMany: vi.fn(),
    },
    directMessage: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
    },
    dMMessage: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    dMMessageRead: {
      createMany: vi.fn(),
    },
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
    $transaction: vi.fn((cb) => {
        if (typeof cb === 'function') return cb(vi.mocked(prisma));
        if (Array.isArray(cb)) return Promise.all(cb);
        return Promise.resolve(cb);
    }),
  },
}));

// Mock better-auth BEFORE importing AppModule
vi.mock('../src/auth/better-auth', () => ({
  auth: {
    options: {
      basePath: '/api/auth'
    },
    api: {
      signInEmail: vi.fn(),
      signUpEmail: vi.fn(),
      getSession: vi.fn(),
      signInSocial: vi.fn(),
    },
    handler: vi.fn().mockImplementation((req, res, next) => {
        if (typeof next === 'function') next();
    }),
  },
}));

// Mock @repo/shared/server
vi.mock('@repo/shared/server', () => ({
  validateEnv: vi.fn((config) => config || {
    ALLOWED_ORIGINS: 'http://localhost:3000'
  }),
  getAblyRest: vi.fn(() => ({
    channels: {
      get: vi.fn(() => ({
        publish: vi.fn(),
      })),
    },
  })),
  getAblyServer: vi.fn(() => ({
    channels: {
      get: vi.fn(() => ({
        publish: vi.fn(),
      })),
    },
  })),
  AblyChannels: {
    channel: vi.fn((id) => `channel:${id}`),
    dm: vi.fn((id) => `dm:${id}`),
    user: vi.fn((id) => `user:${id}`),
    workspace: vi.fn((id) => `workspace:${id}`),
  },
  AblyEvents: {
    MESSAGE_SENT: 'message.sent',
    MESSAGE_READ: 'message.read',
    MESSAGE_UPDATED: 'message.updated',
    MESSAGE_DELETED: 'message.deleted',
    MESSAGE_REACTION: 'message.reaction',
    DM_RECEIVED: 'dm.received',
  },
  setSocketioProvider: vi.fn(),
  publishToAbly: vi.fn(),
  EVENTS: {
    CHANNEL_CREATED: 'channel.created',
    CHANNEL_UPDATED: 'channel.updated',
    CHANNEL_DELETED: 'channel.deleted',
  },
  processScheduledNotifications: vi.fn(),
  isUserEligibleForAsset: vi.fn().mockResolvedValue(true),
  logAssetUsage: vi.fn(),
  notifyNewMessage: vi.fn(),
  notifyDM: vi.fn(),
  notifyMentions: vi.fn(),
  notifyChannel: vi.fn(),
  notifyReply: vi.fn(),
  sendAndroidPushNotification: vi.fn(),
}));

import { AppModule } from '../src/app.module';
import { prisma } from '@repo/database';
import { auth } from '../src/auth/better-auth';
import { AndroidAuthController } from '../src/auth/android-auth/android-auth.controller';

describe('Android API Verification Suite', () => {
  let app: NestFastifyApplication;
  const mockUser = { id: 'user-1', name: 'Test User', email: 'test@example.com', username: 'testuser' };
  const mockToken = 'mock-token';

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
    app.setGlobalPrefix('api');
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('Authentication', () => {
    it('signup - should work via controller', async () => {
        const controller = app.get(AndroidAuthController);
        vi.spyOn(auth.api, 'signUpEmail').mockResolvedValue({
            session: { token: 'new-token', expiresAt: new Date() },
            user: mockUser,
        });

        const result = await controller.signup({
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User',
            username: 'testuser',
        });
        expect(result).toHaveProperty('token', 'new-token');
    });

    it('login - should work via controller', async () => {
        const controller = app.get(AndroidAuthController);
        vi.spyOn(auth.api, 'signInEmail').mockResolvedValue({
            session: { token: 'mock-token', expiresAt: new Date() },
            user: mockUser,
        });

        const result = await controller.login({
            email: 'test@example.com',
            password: 'password123',
        });
        expect(result).toHaveProperty('token', 'mock-token');
    });
  });

  describe('Messaging', () => {
    beforeEach(() => {
        vi.spyOn(auth.api, 'getSession').mockResolvedValue({
            session: { id: 'session-1', userId: 'user-1', token: mockToken },
            user: mockUser,
        });
    });

    it('POST /api/channels/:id/messages - should send a message', async () => {
      (prisma.channel.findUnique as any).mockResolvedValue({ id: 'ch-1', type: 'channel' });
      (prisma.message.create as any).mockResolvedValue({
          id: 'msg-1',
          content: 'Hello API',
          userId: 'user-1',
          user: mockUser,
          mentions: [],
      });

      const response = await request(app.getHttpServer())
        .post('/api/channels/ch-1/messages')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ content: 'Hello API' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id', 'msg-1');
    });

    it('POST /api/channels/:id/messages/read - should mark messages as read', async () => {
      (prisma.messageRead.createMany as any).mockResolvedValue({ count: 1 });

      const response = await request(app.getHttpServer())
        .post('/api/channels/ch-1/messages/read')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ messageIds: ['msg-1'] });

      expect(response.status).toBe(201);
    });
  });

  describe('DMs', () => {
      beforeEach(() => {
          vi.spyOn(auth.api, 'getSession').mockResolvedValue({
              session: { id: 'session-1', userId: 'user-1', token: mockToken },
              user: mockUser,
          });
      });

      it('GET /api/dms - should return DM list with unread counts', async () => {
          (prisma.directMessage.findMany as any).mockResolvedValue([
              {
                  id: 'dm-1',
                  participant1Id: 'user-1',
                  participant2Id: 'user-2',
                  participant1: mockUser,
                  participant2: { id: 'user-2', name: 'Other User' },
                  messages: [],
                  _count: { messages: 5 },
                  lastMessageAt: new Date(),
              }
          ]);

          const response = await request(app.getHttpServer())
            .get('/api/dms')
            .set('Authorization', `Bearer ${mockToken}`);

          expect(response.status).toBe(200);
          expect(response.body[0]._count).toHaveProperty('messages', 5);
      });
  });
});

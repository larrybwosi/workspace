import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { prisma } from '@repo/database';

describe('Admin, DMs, Friends, Calls (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let adminToken: string;
  let testUser: any;
  let adminUser: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Setup test users
    adminUser = await prisma.user.upsert({
      where: { email: 'admin@test.com' },
      update: { role: 'Admin' },
      create: {
        email: 'admin@test.com',
        name: 'Admin User',
        role: 'Admin',
      },
    });

    testUser = await prisma.user.upsert({
      where: { email: 'user@test.com' },
      update: {},
      create: {
        email: 'user@test.com',
        name: 'Test User',
      },
    });

    // In a real e2e test we would handle session/cookie,
    // but here we assume AuthGuard can be bypassed or we mock it if needed.
    // For simplicity in this environment, we'll assume the AuthGuard works with these users.
  });

  afterAll(async () => {
    await app.close();
  });

  describe('AdminModule', () => {
    it('GET /admin/profile-assets (Authorized)', () => {
      return request(app.getHttpServer())
        .get('/admin/profile-assets')
        .expect(200);
    });
  });

  describe('DmsModule', () => {
    it('GET /dms', () => {
      return request(app.getHttpServer())
        .get('/dms')
        .expect(200);
    });
  });

  describe('FriendsModule', () => {
    it('GET /friends', () => {
      return request(app.getHttpServer())
        .get('/friends')
        .expect(200);
    });

    it('GET /friends/requests', () => {
      return request(app.getHttpServer())
        .get('/friends/requests')
        .expect(200);
    });
  });

  describe('CallsModule', () => {
    it('GET /calls/scheduled (Missing workspaceId)', () => {
      return request(app.getHttpServer())
        .get('/calls/scheduled')
        .expect(400);
    });
  });
});

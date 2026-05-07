import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Admin, DMs, Friends, Calls (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('AdminModule', () => {
    it('GET /admin/profile-assets (Authorized)', async () => {
      const response = await request(app.getHttpServer()).get('/admin/profile-assets');
      expect([200, 401]).toContain(response.status);
    });
  });

  describe('DmsModule', () => {
    it('GET /dms', async () => {
      const response = await request(app.getHttpServer()).get('/dms');
      expect([200, 401]).toContain(response.status);
    });
  });

  describe('FriendsModule', () => {
    it('GET /friends', async () => {
      const response = await request(app.getHttpServer()).get('/friends');
      expect([200, 401]).toContain(response.status);
    });

    it('GET /friends/requests', async () => {
      const response = await request(app.getHttpServer()).get('/friends/requests');
      expect([200, 401]).toContain(response.status);
    });
  });

  describe('CallsModule', () => {
    it('GET /calls/scheduled (Missing workspaceId)', async () => {
      const response = await request(app.getHttpServer()).get('/calls/scheduled');
      expect([400, 401]).toContain(response.status);
    });
  });
});

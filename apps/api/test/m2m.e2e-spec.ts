import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { prisma } from '@repo/database';
import { auth } from '../src/auth/better-auth';
import { execSync } from 'child_process';

describe('Organization M2M Lifecycle (e2e)', () => {
  let app: NestFastifyApplication;
  let testUser: any;
  let organization: any;
  let sessionToken: string;
  let m2mApp: any;
  let m2mAccessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    // Ensure database schema is up to date in CI/test environments
    if (process.env.DATABASE_URL) {
      try {
        console.log('Pushing database schema...');
        // We use pnpm from the root to ensure all environment variables and paths are handled correctly
        // We explicitly pass the DATABASE_URL through the command line to ensure prisma picks it up
        execSync(`DATABASE_URL="${process.env.DATABASE_URL}" pnpm --filter @repo/database db:push`, {
          stdio: 'inherit',
          env: { ...process.env },
        });
      } catch (e) {
        console.error('Failed to push schema, tests might fail if DB is not initialized:', e);
      }
    }

    // Setup: Create test user
    try {
      testUser = await prisma.user.create({
        data: {
          name: 'M2M Test User',
          email: `m2m-test-${Date.now()}@example.com`,
        },
      });

      // Create session for user
      const { internalAdapter } = await auth.$context;
      const session = await internalAdapter.createSession(testUser.id);
      sessionToken = session.token;

      // Create organization
      organization = await auth.api.createOrganization({
        body: {
          name: 'M2M Test Org',
          slug: `m2m-test-org-${Date.now()}`,
        },
        headers: {
          authorization: `Bearer ${sessionToken}`,
        },
      });
    } catch (e) {
      console.error('Failed to setup test environment in beforeAll:', e);
    }
  });

  afterAll(async () => {
    // Cleanup
    if (organization?.id) {
        await prisma.organization.delete({ where: { id: organization.id } });
    }
    if (testUser?.id) {
        await prisma.user.delete({ where: { id: testUser.id } });
    }
    if (app) await app.close();
  });

  it('1. Should create an M2M application', async () => {
    const response = await request(app.getHttpServer())
      .post(`/organizations/${organization.slug}/m2m`)
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({
        name: 'Test Provisioner',
        scopes: ['provisioning:workspaces'],
      });

    expect(response.status).toBe(201);
    expect(response.body.clientId).toBeDefined();
    expect(response.body.clientSecret).toBeDefined();
    m2mApp = response.body;
  });

  it('2. Should exchange client credentials for a token', async () => {
    const response = await request(app.getHttpServer())
      .post('/v2/oauth/token')
      .send({
        grant_type: 'client_credentials',
        client_id: m2mApp.clientId,
        client_secret: m2mApp.clientSecret,
        scope: 'provisioning:workspaces',
      });

    expect(response.status).toBe(201); // Fastify returns 201 for POST by default in Nest
    expect(response.body.access_token).toBeDefined();
    expect(response.body.token_type).toBe('Bearer');
    m2mAccessToken = response.body.access_token;
  });

  it('3. Should provision a new workspace using the M2M token', async () => {
    const workspaceSlug = `m2m-workspace-${Date.now()}`;
    const response = await request(app.getHttpServer())
      .post('/v2/provisioning/workspaces')
      .set('Authorization', `Bearer ${m2mAccessToken}`)
      .send({
        name: 'M2M Provisioned Workspace',
        slug: workspaceSlug,
        ownerEmail: testUser.email,
        description: 'Provisioned via API test',
        channels: ['general', 'dev'],
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.workspace.slug).toBe(workspaceSlug);
  });

  it('4. Should list provisioned workspaces in the organization', async () => {
    const response = await request(app.getHttpServer())
      .get(`/organizations/${organization.slug}/workspaces`)
      .set('Authorization', `Bearer ${sessionToken}`);

    expect(response.status).toBe(200);
    expect(response.body.workspaces).toBeDefined();
    expect(response.body.workspaces.length).toBeGreaterThan(0);
    expect(response.body.workspaces[0].name).toBe('M2M Provisioned Workspace');
  });

  it('5. Should list M2M applications in the organization', async () => {
    const response = await request(app.getHttpServer())
      .get(`/organizations/${organization.slug}/m2m`)
      .set('Authorization', `Bearer ${sessionToken}`);

    expect(response.status).toBe(200);
    expect(response.body.applications).toBeDefined();
    expect(response.body.applications.some((app: any) => app.clientId === m2mApp.clientId)).toBe(true);
  });
});

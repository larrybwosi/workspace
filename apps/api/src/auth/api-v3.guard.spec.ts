import { ApiV3Guard } from './api-v3.guard';
import { ExecutionContext, UnauthorizedException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { prisma } from '@repo/database';
import { auth } from '@repo/auth';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import * as crypto from 'crypto';

vi.mock('@repo/database', () => ({
  prisma: {
    workspaceApiToken: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    oAuthAccessToken: {
      findUnique: vi.fn(),
    },
    organization: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    workspace: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@repo/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

describe('ApiV3Guard', () => {
  let guard: ApiV3Guard;
  let redisMock: any;
  let configServiceMock: any;

  beforeEach(() => {
    redisMock = {
      incr: vi.fn().mockResolvedValue(1),
      expire: vi.fn().mockResolvedValue(true),
    };
    configServiceMock = {};

    guard = new ApiV3Guard(redisMock, configServiceMock as any);
    vi.clearAllMocks();
  });

  const createMockContext = (
    headers: Record<string, string> = {},
    params: Record<string, string> = {}
  ): ExecutionContext => {
    const request = {
      headers,
      params,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  it('should authenticate valid wst_ workspace API token', async () => {
    const rawToken = 'wst_secret123';
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    (prisma.workspaceApiToken.findUnique as any).mockResolvedValue({
      id: 'token-1',
      token: hashedToken,
      createdById: 'user-1',
      workspaceId: 'ws-123',
      rateLimit: 500,
      permissions: { actions: ['read:webhooks', 'write:webhooks'] },
      expiresAt: new Date(Date.now() + 3600000),
      workspace: { slug: 'acme' },
    });
    (prisma.workspaceApiToken.update as any).mockResolvedValue({});

    const context = createMockContext({ authorization: `Bearer ${rawToken}` }, { slug: 'acme' });
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    const req = context.switchToHttp().getRequest();
    expect(req.v3Context).toEqual({
      userId: 'user-1',
      clientId: 'token-1',
      scopes: ['webhooks:read', 'webhooks:write'],
      workspaceId: 'ws-123',
      workspaceSlug: 'acme',
      isBot: true,
      tokenId: 'token-1',
    });
  });

  it('should authenticate standard better-auth session token in Authorization: Bearer header', async () => {
    const sessionToken = 'c08d987654321session';

    (auth.api.getSession as any).mockResolvedValue({
      user: { id: 'user-session-123' },
      session: { id: 'sess-1', activeOrganizationId: 'org-777' },
    });

    (prisma.organization.findUnique as any).mockResolvedValue({
      id: 'org-777',
      slug: 'my-org',
      members: [{ id: 'mem-1' }],
    });

    const context = createMockContext({ authorization: `Bearer ${sessionToken}` }, { slug: 'my-org' });
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    const req = context.switchToHttp().getRequest();
    expect(req.v3Context).toEqual({
      userId: 'user-session-123',
      clientId: 'session:user-session-123',
      scopes: ['*'],
      workspaceId: 'org-777',
      workspaceSlug: 'my-org',
    });
  });

  it('should throw UnauthorizedException if session is invalid or missing', async () => {
    (auth.api.getSession as any).mockResolvedValue(null);

    const context = createMockContext({ authorization: 'Bearer invalid_session_token' });
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw ForbiddenException if session user is not a member of the requested workspace slug', async () => {
    (auth.api.getSession as any).mockResolvedValue({
      user: { id: 'user-session-123' },
      session: { id: 'sess-1' },
    });

    (prisma.organization.findUnique as any).mockResolvedValue({
      id: 'org-777',
      slug: 'my-org',
      members: [], // User is not in workspace
    });

    const context = createMockContext({ authorization: 'Bearer session_token' }, { slug: 'my-org' });
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});

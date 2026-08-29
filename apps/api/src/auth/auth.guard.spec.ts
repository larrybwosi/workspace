import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from './auth.guard';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { prisma } from '@repo/database';
import { auth } from '@repo/auth';
import * as crypto from 'crypto';

vi.mock('@repo/database', () => ({
  prisma: {
    oAuthAccessToken: {
      findUnique: vi.fn(),
    },
    workspaceApiToken: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    botApplication: {
      findFirst: vi.fn(),
    },
    workspace: {
      findFirst: vi.fn(),
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

describe('AuthGuard', () => {
  let guard: AuthGuard;

  beforeEach(() => {
    guard = new AuthGuard();
    vi.clearAllMocks();
  });

  const createMockContext = (headers: Record<string, string> = {}, requestState: Record<string, any> = {}): ExecutionContext => {
    const request = {
      headers,
      ...requestState,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  it('should allow activation if request already has session and user', async () => {
    const context = createMockContext({}, { session: { id: 's1' }, user: { id: 'u1' } });
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should authenticate valid oat_ M2M OAuth access token', async () => {
    const rawToken = 'oat_test123';
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    (prisma.oAuthAccessToken.findUnique as any).mockResolvedValue({
      id: 'token-1',
      token: hashedToken,
      clientId: 'client-123',
      userId: null,
      referenceId: 'm2m:org-456',
      expiresAt: new Date(Date.now() + 3600000),
    });

    (prisma.botApplication.findFirst as any).mockResolvedValue({
      bot: { id: 'bot-user-1', name: 'Bot User' },
    });

    const context = createMockContext({ authorization: `Bearer ${rawToken}` });
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    const req = context.switchToHttp().getRequest();
    expect(req.user).toEqual({ id: 'bot-user-1', name: 'Bot User' });
    expect(req.session).toBeDefined();
    expect(req.session.id).toBe('token-1');
  });

  it('should throw UnauthorizedException if oat_ token is expired', async () => {
    const rawToken = 'oat_expired';
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    (prisma.oAuthAccessToken.findUnique as any).mockResolvedValue({
      id: 'token-1',
      token: hashedToken,
      expiresAt: new Date(Date.now() - 3600000),
    });

    const context = createMockContext({ authorization: `Bearer ${rawToken}` });
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should authenticate valid wst_ Workspace API token', async () => {
    const rawToken = 'wst_test123';
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    (prisma.workspaceApiToken.findUnique as any).mockResolvedValue({
      id: 'wpt-1',
      token: hashedToken,
      name: 'Test API Token',
      createdById: 'user-99',
      workspaceId: 'ws-123',
      expiresAt: new Date(Date.now() + 3600000),
      createdBy: { id: 'user-99', name: 'Owner User' },
    });

    (prisma.workspaceApiToken.update as any).mockResolvedValue({});

    const context = createMockContext({ authorization: `Bearer ${rawToken}` });
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    const req = context.switchToHttp().getRequest();
    expect(req.user).toEqual({ id: 'user-99', name: 'Owner User' });
    expect(req.session).toEqual({ id: 'wpt-1', userId: 'user-99', workspaceId: 'ws-123' });
    expect(prisma.workspaceApiToken.update).toHaveBeenCalledWith({
      where: { id: 'wpt-1' },
      data: {
        lastUsedAt: expect.any(Date),
        usageCount: { increment: 1 },
      },
    });
  });

  it('should fallback to auth.api.getSession for standard session tokens', async () => {
    (auth.api.getSession as any).mockResolvedValue({
      user: { id: 'user-sess-1', name: 'Session User' },
      session: { id: 'sess-1' },
    });

    const context = createMockContext({ authorization: 'Bearer session_token_123' });
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    const req = context.switchToHttp().getRequest();
    expect(req.user).toEqual({ id: 'user-sess-1', name: 'Session User' });
    expect(req.session).toEqual({ id: 'sess-1' });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { V3OAuthController } from './oauth.controller';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { prisma } from '@repo/database';
import * as crypto from 'crypto';

vi.mock('@repo/database', () => ({
  prisma: {
    botApplication: {
      findUnique: vi.fn(),
    },
    oauthAccessToken: {
      create: vi.fn(),
    },
    oAuthAccessToken: {
      findUnique: vi.fn(),
    },
  },
}));

describe('V3OAuthController', () => {
  let controller: V3OAuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [V3OAuthController],
    }).compile();

    controller = module.get<V3OAuthController>(V3OAuthController);

    vi.clearAllMocks();
  });

  it('should issue a token with valid client credentials for organization M2M', async () => {
    const body = {
      grant_type: 'client_credentials' as const,
      client_id: 'client-id-1',
      client_secret: 'client-secret-1',
      scope: 'provisioning:workspaces',
    };

    const req = {
      ip: '127.0.0.1',
    };

    const hashedSecret = crypto.createHash('sha256').update(body.client_secret).digest('hex');

    (prisma.botApplication.findUnique as any).mockResolvedValue({
      id: 'app-1',
      name: 'M2M Test App',
      clientId: 'client-id-1',
      clientSecret: hashedSecret,
      organizationId: 'org-1',
      scopes: ['provisioning:workspaces'],
      allowedIps: [],
    });

    (prisma as any).oauthAccessToken = {
      create: vi.fn().mockResolvedValue({
        id: 'token-id-1',
        scopes: ['provisioning:workspaces'],
      }),
    };

    const result = await controller.getToken(req, body);

    expect(result.access_token).toBeDefined();
    expect(result.access_token.startsWith('oat_')).toBe(true);
    expect(result.token_type).toBe('Bearer');
    expect(result.scope).toBe('provisioning:workspaces');
    expect(prisma.botApplication.findUnique).toHaveBeenCalledWith({
      where: { clientId: 'client-id-1' },
      include: { bot: true },
    });
  });

  it('should throw UnauthorizedException for incorrect client credentials', async () => {
    const body = {
      grant_type: 'client_credentials' as const,
      client_id: 'client-id-1',
      client_secret: 'wrong-secret',
    };

    const req = { ip: '127.0.0.1' };

    (prisma.botApplication.findUnique as any).mockResolvedValue({
      id: 'app-1',
      clientId: 'client-id-1',
      clientSecret: crypto.createHash('sha256').update('right-secret').digest('hex'),
    });

    await expect(controller.getToken(req, body)).rejects.toThrow(
      'Invalid client credentials'
    );
  });

  it('should throw ForbiddenException if request IP is not in allowlist', async () => {
    const body = {
      grant_type: 'client_credentials' as const,
      client_id: 'client-id-1',
      client_secret: 'secret-1',
    };

    const req = { ip: '192.168.1.1' };

    (prisma.botApplication.findUnique as any).mockResolvedValue({
      id: 'app-1',
      clientId: 'client-id-1',
      clientSecret: 'secret-1',
      allowedIps: ['127.0.0.1'],
    });

    await expect(controller.getToken(req, body)).rejects.toThrow(
      /is not in the allowlist/
    );
  });

  it('should throw ForbiddenException if requested scope is not authorized', async () => {
    const body = {
      grant_type: 'client_credentials' as const,
      client_id: 'client-id-1',
      client_secret: 'secret-1',
      scope: 'messages:write',
    };

    const req = { ip: '127.0.0.1' };

    (prisma.botApplication.findUnique as any).mockResolvedValue({
      id: 'app-1',
      clientId: 'client-id-1',
      clientSecret: 'secret-1',
      scopes: ['messages:read'],
      allowedIps: [],
    });

    await expect(controller.getToken(req, body)).rejects.toThrow(
      /Unauthorized scopes requested/
    );
  });
});

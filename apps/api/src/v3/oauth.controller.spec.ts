import { Test, TestingModule } from '@nestjs/testing';
import { V3OAuthController } from './oauth.controller';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { prisma } from '@repo/database';
import * as crypto from 'crypto';

vi.mock('@repo/database', () => ({
  prisma: {
    organization: {
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

  it('should issue a wrapped token response with valid client credentials for organization M2M', async () => {
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

    (prisma.organization.findUnique as any).mockResolvedValue({
      id: 'org-1',
      name: 'M2M Test Organization',
      clientId: 'client-id-1',
      clientSecret: hashedSecret,
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

    expect(result.success).toBe(true);
    expect(result.timestamp).toBeDefined();
    expect(result.data.access_token).toBeDefined();
    expect(result.data.access_token.startsWith('oat_')).toBe(true);
    expect(result.data.token_type).toBe('Bearer');
    expect(result.data.scope).toBe('provisioning:workspaces');
    expect(prisma.organization.findUnique).toHaveBeenCalledWith({
      where: { clientId: 'client-id-1' },
    });
  });

  it('should support plain secrets if org.clientSecret is the plain secret', async () => {
    const body = {
      grant_type: 'client_credentials' as const,
      client_id: 'client-id-1',
      client_secret: 'my-plain-secret',
    };

    const req = { ip: '127.0.0.1' };

    (prisma.organization.findUnique as any).mockResolvedValue({
      id: 'org-1',
      clientId: 'client-id-1',
      clientSecret: 'my-plain-secret',
      scopes: ['*'],
      allowedIps: [],
    });

    (prisma as any).oauthAccessToken = {
      create: vi.fn().mockResolvedValue({
        id: 'token-id-1',
        scopes: ['*'],
      }),
    };

    const result = await controller.getToken(req, body);
    expect(result.success).toBe(true);
    expect(result.data.access_token).toBeDefined();
  });

  it('should throw UnauthorizedException for incorrect client credentials', async () => {
    const body = {
      grant_type: 'client_credentials' as const,
      client_id: 'client-id-1',
      client_secret: 'wrong-secret',
    };

    const req = { ip: '127.0.0.1' };

    (prisma.organization.findUnique as any).mockResolvedValue({
      id: 'org-1',
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

    (prisma.organization.findUnique as any).mockResolvedValue({
      id: 'org-1',
      clientId: 'client-id-1',
      clientSecret: 'secret-1',
      allowedIps: ['127.0.0.1'],
    });

    await expect(controller.getToken(req, body)).rejects.toThrow(
      /is not in the allowlist/
    );
  });

  it('should accept normalized IPv4-mapped IPv6 address when IPv4 is in allowlist', async () => {
    const body = {
      grant_type: 'client_credentials' as const,
      client_id: 'client-id-1',
      client_secret: 'secret-1',
    };

    const req = { ip: '::ffff:127.0.0.1' };

    (prisma.organization.findUnique as any).mockResolvedValue({
      id: 'org-1',
      clientId: 'client-id-1',
      clientSecret: 'secret-1',
      allowedIps: ['127.0.0.1'],
      scopes: ['*'],
    });

    (prisma as any).oauthAccessToken = {
      create: vi.fn().mockResolvedValue({
        id: 'token-id-1',
        scopes: ['*'],
      }),
    };

    const result = await controller.getToken(req, body);
    expect(result.success).toBe(true);
  });

  it('should throw ForbiddenException if requested scope is not authorized', async () => {
    const body = {
      grant_type: 'client_credentials' as const,
      client_id: 'client-id-1',
      client_secret: 'secret-1',
      scope: 'messages:write',
    };

    const req = { ip: '127.0.0.1' };

    (prisma.organization.findUnique as any).mockResolvedValue({
      id: 'org-1',
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

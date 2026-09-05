import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiTokensController } from './api-tokens.controller';
import { AuthGuard } from '../auth/auth.guard';
import { prisma } from '@repo/database';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

// Mock @repo/database prisma
vi.mock('@repo/database', () => ({
  prisma: {
    workspace: {
      findUnique: vi.fn(),
    },
    workspaceApiToken: {
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    workspaceAuditLog: {
      create: vi.fn().mockReturnValue({ catch: vi.fn() }),
    },
  },
}));

describe('ApiTokensController', () => {
  let controller: ApiTokensController;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApiTokensController],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ApiTokensController>(ApiTokensController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  const mockUser = { id: 'user-1', name: 'Alice', username: 'alice' } as any;

  describe('getApiTokens', () => {
    it('should throw NotFoundException when workspace is not found', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue(null);

      await expect(controller.getApiTokens(mockUser, 'non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not owner/admin', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue({
        id: 'ws-1',
        members: [{ role: 'member' }],
        apiTokens: [],
      });

      await expect(controller.getApiTokens(mockUser, 'acme')).rejects.toThrow(ForbiddenException);
    });

    it('should return masked API tokens for workspace owners', async () => {
      const mockRawTokens = [
        {
          id: 'token-1',
          name: 'CI Token',
          token: 'wst_12345678901234567890123456789012',
          permissions: { actions: ['read:members'] },
          rateLimit: 1000,
          expiresAt: null,
          lastUsedAt: null,
          usageCount: 0,
          createdAt: new Date(),
          createdBy: { id: 'user-1', name: 'Alice', avatar: null },
        },
      ];

      (prisma.workspace.findUnique as any).mockResolvedValue({
        id: 'ws-1',
        members: [{ role: 'owner' }],
        apiTokens: mockRawTokens,
      });

      const result = await controller.getApiTokens(mockUser, 'acme');
      expect(result.tokens).toHaveLength(1);
      expect(result.tokens[0].token).toBe('wst_************************56789012');
    });
  });

  describe('createApiToken', () => {
    it('should throw NotFoundException when workspace is not found', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue(null);

      await expect(
        controller.createApiToken(mockUser, 'non-existent', {
          name: 'New Token',
          permissions: { actions: ['read:members'] },
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when non-admin/non-owner attempts to create token', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue({
        id: 'ws-1',
        members: [{ role: 'member' }],
      });

      await expect(
        controller.createApiToken(mockUser, 'acme', {
          name: 'New Token',
          permissions: { actions: ['read:members'] },
        })
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if schema validation fails', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue({
        id: 'ws-1',
        members: [{ role: 'admin' }],
      });

      await expect(
        controller.createApiToken(mockUser, 'acme', {
          name: '',
          permissions: { actions: [] },
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should create API token successfully and trigger background audit log', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue({
        id: 'ws-1',
        members: [{ role: 'owner' }],
      });

      const mockCreatedToken = {
        id: 'token-created',
        workspaceId: 'ws-1',
        name: 'Deployment Token',
        permissions: { actions: ['read:members'] },
        rateLimit: 1000,
        expiresAt: null,
        createdById: 'user-1',
      };

      (prisma.workspaceApiToken.create as any).mockResolvedValue(mockCreatedToken);
      (prisma.workspaceAuditLog.create as any).mockReturnValue({ catch: vi.fn() });

      const dto = {
        name: 'Deployment Token',
        permissions: { actions: ['read:members'] as any },
      };

      const result = await controller.createApiToken(mockUser, 'acme', dto);

      expect(result.id).toBe('token-created');
      expect(result.token).toMatch(/^wst_/);
      expect(prisma.workspaceAuditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          workspaceId: 'ws-1',
          action: 'api_token.created',
          resourceId: 'token-created',
        }),
      });
    });
  });

  describe('deleteApiToken', () => {
    it('should throw NotFoundException when workspace not found', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue(null);

      await expect(controller.deleteApiToken(mockUser, 'non-existent', 'token-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not admin/owner', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue({
        id: 'ws-1',
        members: [{ role: 'member' }],
      });

      await expect(controller.deleteApiToken(mockUser, 'acme', 'token-1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when token deletion count is 0', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue({
        id: 'ws-1',
        members: [{ role: 'admin' }],
      });

      (prisma.workspaceApiToken.deleteMany as any).mockResolvedValue({ count: 0 });

      await expect(controller.deleteApiToken(mockUser, 'acme', 'token-1')).rejects.toThrow(NotFoundException);
    });

    it('should delete API token successfully using deleteMany and trigger background audit log', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue({
        id: 'ws-1',
        members: [{ role: 'owner' }],
      });

      (prisma.workspaceApiToken.deleteMany as any).mockResolvedValue({ count: 1 });
      (prisma.workspaceAuditLog.create as any).mockReturnValue({ catch: vi.fn() });

      const result = await controller.deleteApiToken(mockUser, 'acme', 'token-1');

      expect(result).toEqual({ message: 'API token deleted successfully' });
      expect(prisma.workspaceApiToken.deleteMany).toHaveBeenCalledWith({
        where: { id: 'token-1', workspaceId: 'ws-1' },
      });
      expect(prisma.workspaceAuditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          workspaceId: 'ws-1',
          action: 'api_token.deleted',
          resourceId: 'token-1',
        }),
      });
    });
  });
});

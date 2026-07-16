import { Test, TestingModule } from '@nestjs/testing';
import { V2ApiTokensController } from './api-tokens.controller';
import { prisma } from '@repo/database';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { V2AuditService } from '../v2-audit.service';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

vi.mock('@repo/database', () => ({
  prisma: {
    workspaceApiToken: {
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('V2ApiTokensController', () => {
  let controller: V2ApiTokensController;
  let redis: any;
  let auditService: V2AuditService;

  beforeEach(async () => {
    redis = {
      get: vi.fn(),
      setex: vi.fn(),
      del: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [V2ApiTokensController],
      providers: [
        { provide: 'REDIS_CLIENT', useValue: redis },
        { provide: V2AuditService, useValue: { log: vi.fn().mockReturnValue({ catch: vi.fn() }) } },
        { provide: ConfigService, useValue: { get: vi.fn() } },
      ],
    }).compile();

    controller = module.get<V2ApiTokensController>(V2ApiTokensController);
    auditService = module.get<V2AuditService>(V2AuditService);
  });

  describe('getTokens', () => {
    const context: any = { workspaceId: 'ws-1', scopes: ['tokens:read'] };

    it('should throw ForbiddenException if missing scope', async () => {
      const invalidContext = { workspaceId: 'ws-1', scopes: [] };
      await expect(controller.getTokens(invalidContext)).rejects.toThrow(ForbiddenException);
    });

    it('should return cached tokens if available', async () => {
      const cachedTokens = [{ id: 'tok-1', name: 'My Token' }];
      redis.get.mockResolvedValue(JSON.stringify(cachedTokens));

      const result = await controller.getTokens(context);

      expect(result).toEqual({ tokens: cachedTokens });
      expect(redis.get).toHaveBeenCalledWith('v2:tokens:ws-1');
      expect(prisma.workspaceApiToken.findMany).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache if not in redis', async () => {
      redis.get.mockResolvedValue(null);
      const dbTokens = [{ id: 'tok-1', name: 'My Token' }];
      (prisma.workspaceApiToken.findMany as any).mockResolvedValue(dbTokens);

      const result = await controller.getTokens(context);

      expect(result).toEqual({ tokens: dbTokens });
      expect(redis.setex).toHaveBeenCalledWith('v2:tokens:ws-1', 600, JSON.stringify(dbTokens));
    });
  });

  describe('createToken', () => {
    const context: any = { workspaceId: 'ws-1', scopes: ['tokens:write'] };
    const createDto = {
      name: 'New Token',
      permissions: { actions: ['read:members'] },
      rateLimit: 1000,
    };

    it('should create token and invalidate cache', async () => {
      const createdToken = { id: 'tok-2', ...createDto, workspaceId: 'ws-1' };
      (prisma.workspaceApiToken.create as any).mockResolvedValue(createdToken);

      const result = await controller.createToken(context, createDto);

      expect(result).toEqual(expect.objectContaining({ id: 'tok-2', name: 'New Token' }));
      expect(result.token).toBeDefined();
      expect(redis.del).toHaveBeenCalledWith('v2:tokens:ws-1');
      expect(prisma.workspaceApiToken.create).toHaveBeenCalled();
    });
  });

  describe('deleteToken', () => {
    const context: any = { workspaceId: 'ws-1', scopes: ['tokens:write'] };

    it('should delete token and invalidate cache in one database RTT', async () => {
      const deletedToken = { id: 'tok-1', workspaceId: 'ws-1', name: 'Deleted Token' };
      (prisma.workspaceApiToken.delete as any).mockResolvedValue(deletedToken);

      const result = await controller.deleteToken(context, 'tok-1');

      expect(result).toEqual({ success: true });
      expect(prisma.workspaceApiToken.delete).toHaveBeenCalledWith({
        where: { id: 'tok-1', workspaceId: 'ws-1' },
      });
      expect(redis.del).toHaveBeenCalledWith('v2:tokens:ws-1');
    });

    it('should throw NotFoundException if delete fails with P2025', async () => {
      const error: any = new Error('Record to delete not found');
      error.code = 'P2025';
      (prisma.workspaceApiToken.delete as any).mockRejectedValue(error);

      await expect(controller.deleteToken(context, 'tok-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('rotateToken', () => {
    const context: any = { workspaceId: 'ws-1', scopes: ['tokens:write'] };

    it('should rotate token and invalidate cache in one database RTT', async () => {
      const updatedToken = { id: 'tok-1', workspaceId: 'ws-1', name: 'Rotated Token' };
      (prisma.workspaceApiToken.update as any).mockResolvedValue(updatedToken);

      const result = await controller.rotateToken(context, 'tok-1');

      expect(result).toEqual(expect.objectContaining({ id: 'tok-1', name: 'Rotated Token' }));
      expect(result.token).toBeDefined();
      expect(prisma.workspaceApiToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'tok-1', workspaceId: 'ws-1' },
          data: expect.objectContaining({
            token: expect.any(String),
            updatedAt: expect.any(Date),
          }),
        })
      );
      expect(redis.del).toHaveBeenCalledWith('v2:tokens:ws-1');
    });

    it('should throw NotFoundException if update fails with P2025', async () => {
      const error: any = new Error('Record to rotate not found');
      error.code = 'P2025';
      (prisma.workspaceApiToken.update as any).mockRejectedValue(error);

      await expect(controller.rotateToken(context, 'tok-1')).rejects.toThrow(NotFoundException);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { V2WebhooksController } from './webhooks.controller';
import { prisma } from '@repo/database';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { V2AuditService } from '../v2-audit.service';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

vi.mock('@repo/database', () => ({
  prisma: {
    workspaceWebhook: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('V2WebhooksController', () => {
  let controller: V2WebhooksController;
  let redis: any;
  let auditService: V2AuditService;

  beforeEach(async () => {
    redis = {
      get: vi.fn(),
      setex: vi.fn(),
      del: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [V2WebhooksController],
      providers: [
        { provide: 'REDIS_CLIENT', useValue: redis },
        { provide: V2AuditService, useValue: { log: vi.fn().mockReturnValue({ catch: vi.fn() }) } },
        { provide: ConfigService, useValue: { get: vi.fn() } },
      ],
    }).compile();

    controller = module.get<V2WebhooksController>(V2WebhooksController);
    auditService = module.get<V2AuditService>(V2AuditService);
  });

  describe('getWebhooks', () => {
    const context: any = { workspaceId: 'ws-1', scopes: ['webhooks:read'] };

    it('should throw ForbiddenException if missing scope', async () => {
      const invalidContext = { workspaceId: 'ws-1', scopes: [] };
      await expect(controller.getWebhooks(invalidContext)).rejects.toThrow(ForbiddenException);
    });

    it('should return cached webhooks if available', async () => {
      const cachedWebhooks = [{ id: 'wh-1', name: 'My Webhook' }];
      redis.get.mockResolvedValue(JSON.stringify(cachedWebhooks));

      const result = await controller.getWebhooks(context);

      expect(result).toEqual({ webhooks: cachedWebhooks });
      expect(redis.get).toHaveBeenCalledWith('v2:webhooks:ws-1');
      expect(prisma.workspaceWebhook.findMany).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache if not in redis', async () => {
      redis.get.mockResolvedValue(null);
      const dbWebhooks = [{ id: 'wh-1', name: 'My Webhook' }];
      (prisma.workspaceWebhook.findMany as any).mockResolvedValue(dbWebhooks);

      const result = await controller.getWebhooks(context);

      expect(result).toEqual({ webhooks: dbWebhooks });
      expect(redis.setex).toHaveBeenCalledWith('v2:webhooks:ws-1', 600, JSON.stringify(dbWebhooks));
    });
  });

  describe('createWebhook', () => {
    const context: any = { workspaceId: 'ws-1', scopes: ['webhooks:write'] };
    const createDto = {
      name: 'New Webhook',
      url: 'https://example.com/webhook',
      events: ['message.sent'],
      active: true,
    };

    it('should create webhook and invalidate cache', async () => {
      const createdWebhook = { id: 'wh-2', ...createDto, workspaceId: 'ws-1' };
      (prisma.workspaceWebhook.create as any).mockResolvedValue(createdWebhook);

      const result = await controller.createWebhook(context, createDto);

      expect(result.webhook).toEqual(createdWebhook);
      expect(redis.del).toHaveBeenCalledWith('v2:webhooks:ws-1');
      expect(prisma.workspaceWebhook.create).toHaveBeenCalled();
    });
  });

  describe('getWebhook', () => {
    const context: any = { workspaceId: 'ws-1', scopes: ['webhooks:read'] };

    it('should fetch webhook using findUnique and verify workspaceId', async () => {
      const webhook = { id: 'wh-1', workspaceId: 'ws-1', name: 'Webhook 1' };
      (prisma.workspaceWebhook.findUnique as any).mockResolvedValue(webhook);

      const result = await controller.getWebhook(context, 'wh-1');

      expect(result).toEqual({ webhook });
      expect(prisma.workspaceWebhook.findUnique).toHaveBeenCalledWith({
        where: { id: 'wh-1' },
        include: { logs: { take: 10, orderBy: { createdAt: 'desc' } } },
      });
    });

    it('should throw NotFoundException if workspaceId does not match', async () => {
      const webhook = { id: 'wh-1', workspaceId: 'ws-different', name: 'Webhook 1' };
      (prisma.workspaceWebhook.findUnique as any).mockResolvedValue(webhook);

      await expect(controller.getWebhook(context, 'wh-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if webhook is not found', async () => {
      (prisma.workspaceWebhook.findUnique as any).mockResolvedValue(null);

      await expect(controller.getWebhook(context, 'wh-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateWebhook', () => {
    const context: any = { workspaceId: 'ws-1', scopes: ['webhooks:write'] };
    const updateDto = { name: 'Updated Name' };

    it('should update webhook and invalidate cache', async () => {
      const updatedWebhook = { id: 'wh-1', workspaceId: 'ws-1', name: 'Updated Name' };

      (prisma.workspaceWebhook.update as any).mockResolvedValue(updatedWebhook);

      const result = await controller.updateWebhook(context, 'wh-1', updateDto);

      expect(result.webhook).toEqual(updatedWebhook);
      expect(prisma.workspaceWebhook.update).toHaveBeenCalledWith({
        where: { id: 'wh-1', workspaceId: 'ws-1' },
        data: updateDto,
      });
      expect(redis.del).toHaveBeenCalledWith('v2:webhooks:ws-1');
    });

    it('should throw NotFoundException if update fails with P2025', async () => {
      const error: any = new Error('Record to update not found');
      error.code = 'P2025';
      (prisma.workspaceWebhook.update as any).mockRejectedValue(error);

      await expect(controller.updateWebhook(context, 'wh-1', updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteWebhook', () => {
    const context: any = { workspaceId: 'ws-1', scopes: ['webhooks:write'] };

    it('should delete webhook and invalidate cache', async () => {
      const deletedWebhook = { id: 'wh-1', workspaceId: 'ws-1', name: 'My Webhook' };

      (prisma.workspaceWebhook.delete as any).mockResolvedValue(deletedWebhook);

      const result = await controller.deleteWebhook(context, 'wh-1');

      expect(result).toEqual({ success: true });
      expect(prisma.workspaceWebhook.delete).toHaveBeenCalledWith({
        where: { id: 'wh-1', workspaceId: 'ws-1' },
      });
      expect(redis.del).toHaveBeenCalledWith('v2:webhooks:ws-1');
    });

    it('should throw NotFoundException if delete fails with P2025', async () => {
      const error: any = new Error('Record to delete not found');
      error.code = 'P2025';
      (prisma.workspaceWebhook.delete as any).mockRejectedValue(error);

      await expect(controller.deleteWebhook(context, 'wh-1')).rejects.toThrow(NotFoundException);
    });
  });
});

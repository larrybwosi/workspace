import { Test, TestingModule } from '@nestjs/testing';
import { V3WebhooksController } from './v3-webhooks.controller';
import { ApiV3Guard } from '../auth/api-v3.guard';
import { ConfigService } from '@nestjs/config';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { prisma } from '@repo/database';

vi.mock('@repo/database', () => ({
  prisma: {
    workspaceWebhook: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    workspaceAuditLog: {
      create: vi.fn(),
    },
  },
}));

describe('V3WebhooksController', () => {
  let controller: V3WebhooksController;
  let redisClient: any;

  beforeEach(async () => {
    redisClient = {
      get: vi.fn(),
      setex: vi.fn(),
      del: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [V3WebhooksController],
      providers: [
        { provide: 'REDIS_CLIENT', useValue: redisClient },
        { provide: ConfigService, useValue: {} },
        ApiV3Guard,
      ],
    }).compile();

    controller = module.get<V3WebhooksController>(V3WebhooksController);

    vi.clearAllMocks();
  });

  describe('getWebhooks', () => {
    it('should list webhooks in wrapped standard response and cache on miss', async () => {
      const context = {
        scopes: ['webhooks:read'],
        workspaceId: 'ws-123',
        userId: 'user-xyz',
      };

      const mockWebhooks = [
        { id: 'wh-1', name: 'Hook 1', url: 'https://example.com/1', events: ['message.sent'], active: true, createdAt: new Date() },
      ];

      redisClient.get.mockResolvedValue(null);
      (prisma.workspaceWebhook.findMany as any).mockResolvedValue(mockWebhooks);

      const result = await controller.getWebhooks(context as any, 'acme-slug');

      expect(result.success).toBe(true);
      expect(result.timestamp).toBeDefined();
      expect(result.data.webhooks).toEqual(mockWebhooks);
      expect(redisClient.get).toHaveBeenCalledWith('v3:workspace:ws-123:webhooks');
      expect(prisma.workspaceWebhook.findMany).toHaveBeenCalledWith({
        where: { workspaceId: 'ws-123' },
        orderBy: { createdAt: 'desc' },
      });
      expect(redisClient.setex).toHaveBeenCalledWith('v3:workspace:ws-123:webhooks', 600, JSON.stringify(mockWebhooks));
    });

    it('should return cached webhooks if cache hits', async () => {
      const context = {
        scopes: ['webhooks:read'],
        workspaceId: 'ws-123',
        userId: 'user-xyz',
      };

      const cachedWebhooks = [
        { id: 'wh-cached', name: 'Cached Webhook', url: 'https://example.com/cached', events: ['channel.created'], active: true, createdAt: new Date().toISOString() },
      ];

      redisClient.get.mockResolvedValue(JSON.stringify(cachedWebhooks));

      const result = await controller.getWebhooks(context as any, 'acme-slug');

      expect(result.success).toBe(true);
      expect(result.data.webhooks).toEqual(cachedWebhooks);
      expect(prisma.workspaceWebhook.findMany).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if missing webhooks:read scope', async () => {
      const context = {
        scopes: ['messages:read'],
        workspaceId: 'ws-123',
        userId: 'user-xyz',
      };

      await expect(controller.getWebhooks(context as any, 'acme-slug')).rejects.toThrow(
        'Forbidden: Missing webhooks:read scope'
      );
    });

    it('should throw BadRequestException if workspaceId is not resolved', async () => {
      const context = {
        scopes: ['webhooks:read'],
        userId: 'user-xyz',
      };

      await expect(controller.getWebhooks(context as any, 'acme-slug')).rejects.toThrow(
        'Workspace ID not resolved'
      );
    });
  });

  describe('createWebhook', () => {
    it('should create a webhook, write audit log, and invalidate cache', async () => {
      const context = {
        scopes: ['webhooks:write'],
        workspaceId: 'ws-123',
        userId: 'user-xyz',
        clientId: 'client-999',
      };

      const body = {
        name: 'My New Webhook',
        url: 'https://myapi.com/webhooks',
        events: ['message.sent'],
        active: true,
      };

      const mockWebhook = {
        id: 'wh-99',
        workspaceId: 'ws-123',
        name: 'My New Webhook',
        url: 'https://myapi.com/webhooks',
        events: ['message.sent'],
        active: true,
        secret: 'random-secret',
        createdAt: new Date(),
      };

      (prisma.workspaceWebhook.create as any).mockResolvedValue(mockWebhook);

      const result = await controller.createWebhook(context as any, 'acme-slug', body);

      expect(result.success).toBe(true);
      expect(result.data.webhook).toEqual(mockWebhook);
      expect(result.data.secret).toBeDefined();
      expect(prisma.workspaceWebhook.create).toHaveBeenCalled();
      expect(redisClient.del).toHaveBeenCalledWith('v3:workspace:ws-123:webhooks');
      expect(prisma.workspaceAuditLog.create).toHaveBeenCalledWith({
        data: {
          workspaceId: 'ws-123',
          userId: 'user-xyz',
          action: 'webhook.created',
          resource: 'webhook',
          resourceId: 'wh-99',
          metadata: {
            creator: 'client-999',
            name: 'My New Webhook',
            url: 'https://myapi.com/webhooks',
          },
        },
      });
    });

    it('should throw ForbiddenException if missing webhooks:write scope', async () => {
      const context = {
        scopes: ['webhooks:read'],
        workspaceId: 'ws-123',
        userId: 'user-xyz',
      };

      const body = {
        name: 'Webhook',
        url: 'https://example.com',
        events: ['message.sent'],
      };

      await expect(controller.createWebhook(context as any, 'acme-slug', body)).rejects.toThrow(
        'Forbidden: Missing webhooks:write scope'
      );
    });
  });

  describe('getWebhook', () => {
    it('should return webhook details if found', async () => {
      const context = {
        scopes: ['webhooks:read'],
        workspaceId: 'ws-123',
        userId: 'user-xyz',
      };

      const mockWebhook = {
        id: 'wh-1',
        workspaceId: 'ws-123',
        name: 'Hook 1',
        url: 'https://example.com/1',
        events: ['message.sent'],
        active: true,
        logs: [],
      };

      (prisma.workspaceWebhook.findUnique as any).mockResolvedValue(mockWebhook);

      const result = await controller.getWebhook(context as any, 'acme-slug', 'wh-1');

      expect(result.success).toBe(true);
      expect(result.data.webhook).toEqual(mockWebhook);
      expect(prisma.workspaceWebhook.findUnique).toHaveBeenCalledWith({
        where: { id: 'wh-1', workspaceId: 'ws-123' },
        include: { logs: { take: 10, orderBy: { createdAt: 'desc' } } },
      });
    });

    it('should throw NotFoundException if webhook is not found', async () => {
      const context = {
        scopes: ['webhooks:read'],
        workspaceId: 'ws-123',
        userId: 'user-xyz',
      };

      (prisma.workspaceWebhook.findUnique as any).mockResolvedValue(null);

      await expect(controller.getWebhook(context as any, 'acme-slug', 'non-existent')).rejects.toThrow(
        'Webhook not found'
      );
    });
  });

  describe('updateWebhook', () => {
    it('should update webhook, write audit log, and invalidate cache', async () => {
      const context = {
        scopes: ['webhooks:write'],
        workspaceId: 'ws-123',
        userId: 'user-xyz',
        clientId: 'client-999',
      };

      const existingWebhook = { id: 'wh-1', workspaceId: 'ws-123' };
      const updatedWebhook = { id: 'wh-1', workspaceId: 'ws-123', name: 'Updated Hook Name' };

      (prisma.workspaceWebhook.findUnique as any).mockResolvedValue(existingWebhook);
      (prisma.workspaceWebhook.update as any).mockResolvedValue(updatedWebhook);

      const result = await controller.updateWebhook(context as any, 'acme-slug', 'wh-1', { name: 'Updated Hook Name' });

      expect(result.success).toBe(true);
      expect(result.data.webhook).toEqual(updatedWebhook);
      expect(prisma.workspaceWebhook.update).toHaveBeenCalledWith({
        where: { id: 'wh-1', workspaceId: 'ws-123' },
        data: { name: 'Updated Hook Name' },
      });
      expect(redisClient.del).toHaveBeenCalledWith('v3:workspace:ws-123:webhooks');
      expect(prisma.workspaceAuditLog.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if webhook to update does not exist', async () => {
      const context = {
        scopes: ['webhooks:write'],
        workspaceId: 'ws-123',
        userId: 'user-xyz',
      };

      (prisma.workspaceWebhook.findUnique as any).mockResolvedValue(null);

      await expect(
        controller.updateWebhook(context as any, 'acme-slug', 'non-existent', { name: 'Update' })
      ).rejects.toThrow('Webhook not found');
    });
  });

  describe('deleteWebhook', () => {
    it('should delete webhook, write audit log, and invalidate cache', async () => {
      const context = {
        scopes: ['webhooks:write'],
        workspaceId: 'ws-123',
        userId: 'user-xyz',
        clientId: 'client-999',
      };

      const existingWebhook = { id: 'wh-1', name: 'Hook to Delete', workspaceId: 'ws-123' };

      (prisma.workspaceWebhook.findUnique as any).mockResolvedValue(existingWebhook);
      (prisma.workspaceWebhook.delete as any).mockResolvedValue(existingWebhook);

      const result = await controller.deleteWebhook(context as any, 'acme-slug', 'wh-1');

      expect(result.success).toBe(true);
      expect(result.data.success).toBe(true);
      expect(prisma.workspaceWebhook.delete).toHaveBeenCalledWith({
        where: { id: 'wh-1' },
      });
      expect(redisClient.del).toHaveBeenCalledWith('v3:workspace:ws-123:webhooks');
      expect(prisma.workspaceAuditLog.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if webhook to delete does not exist', async () => {
      const context = {
        scopes: ['webhooks:write'],
        workspaceId: 'ws-123',
        userId: 'user-xyz',
      };

      (prisma.workspaceWebhook.findUnique as any).mockResolvedValue(null);

      await expect(controller.deleteWebhook(context as any, 'acme-slug', 'non-existent')).rejects.toThrow(
        'Webhook not found'
      );
    });
  });
});

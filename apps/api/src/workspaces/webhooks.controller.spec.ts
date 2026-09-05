import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksController } from './webhooks.controller';
import { AuthGuard } from '../auth/auth.guard';
import { prisma } from '@repo/database';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

// Mock @repo/database prisma
vi.mock('@repo/database', () => ({
  prisma: {
    workspace: {
      findUnique: vi.fn(),
    },
    workspaceWebhook: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

describe('WebhooksController', () => {
  let controller: WebhooksController;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhooksController],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<WebhooksController>(WebhooksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  const mockUser = { id: 'user-1', name: 'Alice', username: 'alice' } as any;

  describe('getWebhooks', () => {
    it('should throw NotFoundException when workspace is not found', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue(null);

      await expect(controller.getWebhooks(mockUser, 'non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not a member', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue({
        id: 'ws-1',
        members: [],
        webhooks: [],
      });

      await expect(controller.getWebhooks(mockUser, 'acme')).rejects.toThrow(ForbiddenException);
    });

    it('should return webhooks list for workspace member', async () => {
      const mockWebhooks = [
        {
          id: 'wh-1',
          name: 'CI Webhook',
          url: 'https://example.com/hook',
          events: ['message.sent'],
          active: true,
        },
      ];

      (prisma.workspace.findUnique as any).mockResolvedValue({
        id: 'ws-1',
        members: [{ role: 'member' }],
        webhooks: mockWebhooks,
      });

      const result = await controller.getWebhooks(mockUser, 'acme');
      expect(result).toEqual(mockWebhooks);
    });
  });

  describe('createWebhook', () => {
    it('should throw NotFoundException when workspace is not found', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue(null);

      await expect(
        controller.createWebhook(mockUser, 'non-existent', {
          name: 'Webhook 1',
          url: 'https://example.com/webhook',
          events: ['message.sent'],
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when non-admin/owner attempts to create webhook', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue({
        id: 'ws-1',
        members: [{ role: 'member' }],
      });

      await expect(
        controller.createWebhook(mockUser, 'acme', {
          name: 'Webhook 1',
          url: 'https://example.com/webhook',
          events: ['message.sent'],
        })
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when schema validation fails', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue({
        id: 'ws-1',
        members: [{ role: 'admin' }],
      });

      await expect(
        controller.createWebhook(mockUser, 'acme', {
          name: '',
          url: 'invalid-url',
          events: [],
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should create webhook successfully for admin', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue({
        id: 'ws-1',
        members: [{ role: 'admin' }],
      });

      const mockCreated = {
        id: 'wh-created',
        workspaceId: 'ws-1',
        name: 'Webhook 1',
        url: 'https://example.com/webhook',
        events: ['message.sent'],
        secret: 'random-secret',
        active: true,
      };

      (prisma.workspaceWebhook.create as any).mockResolvedValue(mockCreated);

      const result = await controller.createWebhook(mockUser, 'acme', {
        name: 'Webhook 1',
        url: 'https://example.com/webhook',
        events: ['message.sent'],
      });

      expect(result).toEqual(mockCreated);
      expect(prisma.workspaceWebhook.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          workspaceId: 'ws-1',
          name: 'Webhook 1',
          url: 'https://example.com/webhook',
        }),
      });
    });
  });

  describe('updateWebhook (BOLA / IDOR Protection)', () => {
    it('should throw NotFoundException when workspace is not found', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue(null);

      await expect(
        controller.updateWebhook(mockUser, 'non-existent', 'wh-1', { active: false })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not owner/admin', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue({
        id: 'ws-1',
        members: [{ role: 'member' }],
      });

      await expect(
        controller.updateWebhook(mockUser, 'acme', 'wh-1', { active: false })
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when webhook does not belong to the workspace (BOLA mitigation)', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue({
        id: 'ws-1', // Workspace A
        members: [{ role: 'admin' }],
      });

      // Target webhook exists in Workspace B (not Workspace A)
      (prisma.workspaceWebhook.findUnique as any).mockResolvedValue({
        id: 'wh-belonging-to-workspace-b',
        workspaceId: 'ws-2',
      });

      await expect(
        controller.updateWebhook(mockUser, 'acme', 'wh-belonging-to-workspace-b', { active: false })
      ).rejects.toThrow(NotFoundException);

      expect(prisma.workspaceWebhook.findUnique).toHaveBeenCalledWith({
        where: { id: 'wh-belonging-to-workspace-b' },
        select: { id: true, workspaceId: true },
      });
    });

    it('should update webhook successfully when webhook belongs to workspace', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue({
        id: 'ws-1',
        members: [{ role: 'owner' }],
      });

      (prisma.workspaceWebhook.findUnique as any).mockResolvedValue({
        id: 'wh-1',
        workspaceId: 'ws-1',
      });

      const updatedWebhook = {
        id: 'wh-1',
        workspaceId: 'ws-1',
        name: 'My Hook',
        active: false,
      };

      (prisma.workspaceWebhook.update as any).mockResolvedValue(updatedWebhook);

      const result = await controller.updateWebhook(mockUser, 'acme', 'wh-1', { active: false });

      expect(result).toEqual(updatedWebhook);
      expect(prisma.workspaceWebhook.findUnique).toHaveBeenCalledWith({
        where: { id: 'wh-1' },
        select: { id: true, workspaceId: true },
      });
      expect(prisma.workspaceWebhook.update).toHaveBeenCalledWith({
        where: { id: 'wh-1' },
        data: { active: false },
      });
    });
  });

  describe('deleteWebhook (BOLA / IDOR Protection)', () => {
    it('should throw NotFoundException when workspace is not found', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue(null);

      await expect(controller.deleteWebhook(mockUser, 'non-existent', 'wh-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not owner/admin', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue({
        id: 'ws-1',
        members: [{ role: 'member' }],
      });

      await expect(controller.deleteWebhook(mockUser, 'acme', 'wh-1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when webhook deletion count is 0 (webhook not found in workspace / BOLA mitigation)', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue({
        id: 'ws-1', // Workspace A
        members: [{ role: 'admin' }],
      });

      // Target webhook is in Workspace B, so deleteMany with workspaceId 'ws-1' matches 0 records
      (prisma.workspaceWebhook.deleteMany as any).mockResolvedValue({ count: 0 });

      await expect(
        controller.deleteWebhook(mockUser, 'acme', 'wh-belonging-to-workspace-b')
      ).rejects.toThrow(NotFoundException);

      expect(prisma.workspaceWebhook.deleteMany).toHaveBeenCalledWith({
        where: {
          id: 'wh-belonging-to-workspace-b',
          workspaceId: 'ws-1',
        },
      });
    });

    it('should delete webhook successfully when webhook belongs to workspace', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue({
        id: 'ws-1',
        members: [{ role: 'owner' }],
      });

      (prisma.workspaceWebhook.deleteMany as any).mockResolvedValue({ count: 1 });

      const result = await controller.deleteWebhook(mockUser, 'acme', 'wh-1');

      expect(result).toEqual({ message: 'Webhook deleted successfully' });
      expect(prisma.workspaceWebhook.deleteMany).toHaveBeenCalledWith({
        where: {
          id: 'wh-1',
          workspaceId: 'ws-1',
        },
      });
    });
  });
});

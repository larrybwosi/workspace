import { Test, TestingModule } from '@nestjs/testing';
import { V3ChannelIncomingWebhooksController } from './v3-channel-incoming-webhooks.controller';
import { ApiV3Guard } from '../auth/api-v3.guard';
import { ConfigService } from '@nestjs/config';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { prisma } from '@repo/database';
import * as crypto from 'crypto';
import * as sharedServer from '@repo/shared/server';
import { V2WebhooksService } from '../v2/v2-webhooks.service';

vi.mock('@repo/database', () => ({
  prisma: {
    channelIncomingWebhook: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    channelIncomingWebhookLog: {
      create: vi.fn(),
    },
    channel: {
      findUnique: vi.fn(),
    },
    botApplication: {
      findFirst: vi.fn(),
    },
    message: {
      create: vi.fn(),
    },
    workspaceAuditLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@repo/shared/server', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    publishRealtime: vi.fn().mockResolvedValue(undefined),
  };
});

describe('V3ChannelIncomingWebhooksController', () => {
  let controller: V3ChannelIncomingWebhooksController;
  let mockWebhooksService: any;

  beforeEach(async () => {
    mockWebhooksService = {
      dispatch: vi.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [V3ChannelIncomingWebhooksController],
      providers: [
        { provide: ConfigService, useValue: {} },
        { provide: 'REDIS_CLIENT', useValue: {} },
        { provide: V2WebhooksService, useValue: mockWebhooksService },
        ApiV3Guard,
      ],
    }).compile();

    controller = module.get<V3ChannelIncomingWebhooksController>(V3ChannelIncomingWebhooksController);

    vi.clearAllMocks();
  });

  describe('getChannelWebhooks', () => {
    it('should list channel webhooks if scopes and channel workspace match', async () => {
      const context = {
        scopes: ['webhooks:read'],
        workspaceId: 'ws-123',
        userId: 'user-xyz',
      };

      const mockChannel = { id: 'ch-1', workspaceId: 'ws-123' };
      const mockWebhooks = [{ id: 'wh-1', name: 'My Hook', channelId: 'ch-1' }];

      (prisma.channel.findUnique as any).mockResolvedValue(mockChannel);
      (prisma.channelIncomingWebhook.findMany as any).mockResolvedValue(mockWebhooks);

      const result = await controller.getChannelWebhooks(context as any, 'acme-slug', 'ch-1');

      expect(result.success).toBe(true);
      expect(result.data.webhooks).toEqual(mockWebhooks);
      expect(prisma.channel.findUnique).toHaveBeenCalledWith({
        where: { id: 'ch-1' },
        select: { id: true, workspaceId: true },
      });
      expect(prisma.channelIncomingWebhook.findMany).toHaveBeenCalledWith({
        where: { channelId: 'ch-1' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should throw ForbiddenException if missing webhooks:read scope', async () => {
      const context = {
        scopes: [],
        workspaceId: 'ws-123',
        userId: 'user-xyz',
      };

      await expect(controller.getChannelWebhooks(context as any, 'acme-slug', 'ch-1')).rejects.toThrow(
        'Forbidden: Missing webhooks:read scope'
      );
    });

    it('should throw NotFoundException if channel does not belong to the workspace', async () => {
      const context = {
        scopes: ['webhooks:read'],
        workspaceId: 'ws-123',
        userId: 'user-xyz',
      };

      (prisma.channel.findUnique as any).mockResolvedValue({ id: 'ch-1', workspaceId: 'ws-different' });

      await expect(controller.getChannelWebhooks(context as any, 'acme-slug', 'ch-1')).rejects.toThrow(
        'Channel not found in this workspace'
      );
    });
  });

  describe('createChannelWebhook', () => {
    it('should create a channel webhook, write audit log, and return token/secret', async () => {
      const context = {
        scopes: ['webhooks:write'],
        workspaceId: 'ws-123',
        userId: 'user-xyz',
        clientId: 'client-999',
      };

      const body = { name: 'New Webhook', description: 'desc' };
      const mockChannel = { id: 'ch-1', workspaceId: 'ws-123' };
      const mockWebhook = {
        id: 'wh-1',
        name: 'New Webhook',
        description: 'desc',
        channelId: 'ch-1',
        token: 'token-xyz',
        secret: 'secret-abc',
      };

      (prisma.channel.findUnique as any).mockResolvedValue(mockChannel);
      (prisma.channelIncomingWebhook.create as any).mockResolvedValue(mockWebhook);

      const result = await controller.createChannelWebhook(context as any, 'acme-slug', 'ch-1', body);

      expect(result.success).toBe(true);
      expect(result.data.webhook).toEqual(mockWebhook);
      expect(prisma.channelIncomingWebhook.create).toHaveBeenCalled();
      expect(prisma.workspaceAuditLog.create).toHaveBeenCalled();
    });
  });

  describe('getChannelWebhook', () => {
    it('should retrieve single webhook details if found', async () => {
      const context = {
        scopes: ['webhooks:read'],
        workspaceId: 'ws-123',
        userId: 'user-xyz',
      };

      const mockChannel = { id: 'ch-1', workspaceId: 'ws-123' };
      const mockWebhook = { id: 'wh-1', name: 'Hook 1', channelId: 'ch-1' };

      (prisma.channel.findUnique as any).mockResolvedValue(mockChannel);
      (prisma.channelIncomingWebhook.findUnique as any).mockResolvedValue(mockWebhook);

      const result = await controller.getChannelWebhook(context as any, 'acme-slug', 'ch-1', 'wh-1');

      expect(result.success).toBe(true);
      expect(result.data.webhook).toEqual(mockWebhook);
    });
  });

  describe('updateChannelWebhook', () => {
    it('should update channel webhook and write audit log', async () => {
      const context = {
        scopes: ['webhooks:write'],
        workspaceId: 'ws-123',
        userId: 'user-xyz',
        clientId: 'client-999',
      };

      const mockChannel = { id: 'ch-1', workspaceId: 'ws-123' };
      const mockWebhook = { id: 'wh-1', name: 'Old Hook', channelId: 'ch-1' };
      const updatedWebhook = { id: 'wh-1', name: 'New Hook', channelId: 'ch-1' };

      (prisma.channel.findUnique as any).mockResolvedValue(mockChannel);
      (prisma.channelIncomingWebhook.findUnique as any).mockResolvedValue(mockWebhook);
      (prisma.channelIncomingWebhook.update as any).mockResolvedValue(updatedWebhook);

      const result = await controller.updateChannelWebhook(context as any, 'acme-slug', 'ch-1', 'wh-1', {
        name: 'New Hook',
      });

      expect(result.success).toBe(true);
      expect(result.data.webhook).toEqual(updatedWebhook);
      expect(prisma.channelIncomingWebhook.update).toHaveBeenCalled();
      expect(prisma.workspaceAuditLog.create).toHaveBeenCalled();
    });
  });

  describe('deleteChannelWebhook', () => {
    it('should delete channel webhook and write audit log', async () => {
      const context = {
        scopes: ['webhooks:write'],
        workspaceId: 'ws-123',
        userId: 'user-xyz',
        clientId: 'client-999',
      };

      const mockChannel = { id: 'ch-1', workspaceId: 'ws-123' };
      const mockWebhook = { id: 'wh-1', name: 'Hook to Delete', channelId: 'ch-1' };

      (prisma.channel.findUnique as any).mockResolvedValue(mockChannel);
      (prisma.channelIncomingWebhook.findUnique as any).mockResolvedValue(mockWebhook);

      const result = await controller.deleteChannelWebhook(context as any, 'acme-slug', 'ch-1', 'wh-1');

      expect(result.success).toBe(true);
      expect(prisma.channelIncomingWebhook.delete).toHaveBeenCalledWith({ where: { id: 'wh-1' } });
      expect(prisma.workspaceAuditLog.create).toHaveBeenCalled();
    });
  });

  describe('executeWebhookByUrlToken', () => {
    it('should post a message, publish to Ably, update stats, and dispatch outgoing webhook', async () => {
      const body = {
        content: 'System Status: Nominal',
        username: 'Status Monitor',
        avatar_url: 'https://img.com/avatar.png',
      };

      const mockWebhook = {
        id: 'wh-123',
        channelId: 'ch-777',
        name: 'Status Webhook',
        isActive: true,
        createdBy: 'user-admin',
        channel: { id: 'ch-777', workspaceId: 'ws-555' },
      };

      const mockBot = { botId: 'bot-123' };
      const mockCreatedMessage = {
        id: 'msg-abc',
        content: 'System Status: Nominal',
        channelId: 'ch-777',
        userId: 'bot-123',
        metadata: {
          isWebhook: true,
          webhookId: 'wh-123',
          overrideUsername: 'Status Monitor',
          overrideAvatar: 'https://img.com/avatar.png',
        },
        user: { id: 'bot-123', name: 'bot' },
      };

      (prisma.channelIncomingWebhook.findUnique as any).mockResolvedValue(mockWebhook);
      (prisma.botApplication.findFirst as any).mockResolvedValue(mockBot);
      (prisma.message.create as any).mockResolvedValue(mockCreatedMessage);

      const result = await controller.executeWebhookByUrlToken('token-abc', body);

      expect(result.success).toBe(true);
      expect(result.data.messageId).toBe('msg-abc');
      expect(prisma.message.create).toHaveBeenCalled();
      expect(prisma.channelIncomingWebhook.update).toHaveBeenCalledWith({
        where: { id: 'wh-123' },
        data: {
          lastReceivedAt: expect.any(Date),
          totalReceived: { increment: 1 },
        },
      });
      expect(sharedServer.publishRealtime).toHaveBeenCalled();
      expect(mockWebhooksService.dispatch).toHaveBeenCalledWith('ws-555', 'message.sent', {
        message: mockCreatedMessage,
      });
      expect(prisma.channelIncomingWebhookLog.create).toHaveBeenCalledWith({
        data: {
          webhookId: 'wh-123',
          payload: body,
          status: 200,
          response: JSON.stringify({ success: true, messageId: 'msg-abc' }),
        },
      });
    });

    it('should enforce signature verification if x-webhook-signature is present', async () => {
      const body = { content: 'Signed Message' };
      const webhookSecret = 'shh-secret';
      const mockWebhook = {
        id: 'wh-123',
        channelId: 'ch-777',
        name: 'Signed Webhook',
        secret: webhookSecret,
        isActive: true,
        createdBy: 'user-admin',
        channel: { id: 'ch-777', workspaceId: 'ws-555' },
      };

      (prisma.channelIncomingWebhook.findUnique as any).mockResolvedValue(mockWebhook);

      // Signature mismatch
      await expect(
        controller.executeWebhookByUrlToken('token-abc', body, 'bad-signature')
      ).rejects.toThrow('Invalid webhook signature');

      expect(prisma.channelIncomingWebhookLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 403,
            response: JSON.stringify({ error: 'Invalid webhook signature' }),
          }),
        })
      );
    });
  });

  describe('executeWebhookByChannelId', () => {
    it('should execute using x-webhook-token header', async () => {
      const body = { content: 'Header auth' };
      const mockWebhook = {
        id: 'wh-123',
        channelId: 'ch-777',
        name: 'Status Webhook',
        isActive: true,
        createdBy: 'user-admin',
        channel: { id: 'ch-777', workspaceId: 'ws-555' },
      };

      (prisma.channelIncomingWebhook.findUnique as any).mockResolvedValue(mockWebhook);
      (prisma.botApplication.findFirst as any).mockResolvedValue({ botId: 'bot-123' });
      (prisma.message.create as any).mockResolvedValue({ id: 'msg-abc' });

      const result = await controller.executeWebhookByChannelId('ch-777', body, 'token-abc');

      expect(result.success).toBe(true);
      expect(result.data.messageId).toBe('msg-abc');
    });

    it('should throw BadRequestException if no token is provided', async () => {
      await expect(
        controller.executeWebhookByChannelId('ch-777', { content: 'No token' })
      ).rejects.toThrow('Webhook token must be supplied in x-webhook-token header or token query parameter');
    });

    it('should throw NotFoundException if channelId mismatch', async () => {
      const mockWebhook = {
        id: 'wh-123',
        channelId: 'ch-different',
        isActive: true,
        channel: { id: 'ch-different', workspaceId: 'ws-555' },
      };

      (prisma.channelIncomingWebhook.findUnique as any).mockResolvedValue(mockWebhook);

      await expect(
        controller.executeWebhookByChannelId('ch-777', { content: 'Mismatch' }, 'token-abc')
      ).rejects.toThrow('Invalid webhook token or channel ID mismatch');
    });
  });
});

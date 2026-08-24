import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebhooksService } from './webhooks.service';
import { prisma } from '@repo/database';
import axios from 'axios';

vi.mock('@repo/database', () => ({
  prisma: {
    workspaceWebhook: {
      findMany: vi.fn(),
    },
    workspaceWebhookLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock('axios');

describe('WebhooksService', () => {
  let service: WebhooksService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new WebhooksService();
  });

  describe('dispatch', () => {
    it('should query workspaceWebhooks using targeted select fields [id, url, secret]', async () => {
      const mockWebhooks = [
        { id: 'wh-1', url: 'https://webhook.site/test', secret: 'wh-secret-1' },
      ];

      (prisma.workspaceWebhook.findMany as any).mockResolvedValue(mockWebhooks);
      (axios.post as any).mockResolvedValue({ status: 200, data: { ok: true } });

      await service.dispatch('ws-123', 'message.sent', { text: 'hello' });

      expect(prisma.workspaceWebhook.findMany).toHaveBeenCalledWith({
        where: {
          workspaceId: 'ws-123',
          active: true,
          events: {
            has: 'message.sent',
          },
        },
        select: {
          id: true,
          url: true,
          secret: true,
        },
      });
    });
  });
});

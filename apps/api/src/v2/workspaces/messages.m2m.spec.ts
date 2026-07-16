import { Test, TestingModule } from '@nestjs/testing';
import { V2MessagesController } from './messages.controller';
import { prisma } from '@repo/database';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { V2AuditService } from '../v2-audit.service';
import { V2WebhooksService } from '../v2-webhooks.service';
import { StorageService } from '../../common/storage/storage.service';
import { ConfigService } from '@nestjs/config';

vi.mock('@repo/database', () => ({
  prisma: {
    channel: {
      findUnique: vi.fn(),
    },
    message: {
      create: vi.fn(),
    },
    botApplication: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    organization: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@repo/shared/server', () => ({
  publishRealtime: vi.fn().mockResolvedValue(undefined),
  AblyChannels: { channel: vi.fn() },
  AblyEvents: { MESSAGE_SENT: 'message.sent' },
}));

describe('V2MessagesController M2M', () => {
  let controller: V2MessagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [V2MessagesController],
      providers: [
        { provide: 'REDIS_CLIENT', useValue: { del: vi.fn() } },
        { provide: V2AuditService, useValue: { log: vi.fn().mockResolvedValue(undefined) } },
        { provide: V2WebhooksService, useValue: { dispatch: vi.fn().mockResolvedValue(undefined) } },
        { provide: StorageService, useValue: { uploadFile: vi.fn() } },
        { provide: ConfigService, useValue: { get: vi.fn() } },
      ],
    }).compile();

    controller = module.get<V2MessagesController>(V2MessagesController);
  });

  it('should use workspace default bot for M2M if legacy m2m user is used', async () => {
    const context: any = {
      workspaceId: 'ws-1',
      userId: 'm2m:org-1',
      clientId: 'm2m-client-1',
      organizationId: 'org-1',
      scopes: ['*']
    };
    const body = { channelId: 'chan-1', content: 'hello system' };
    const req: any = { isMultipart: () => false, body };

    (prisma.channel.findUnique as any).mockResolvedValue({ id: 'chan-1', workspaceId: 'ws-1' });
    (prisma.organization.findUnique as any).mockResolvedValue(null);
    (prisma.botApplication.findFirst as any).mockResolvedValue({ botId: 'system-bot-id' }); // Workspace default bot
    (prisma.message.create as any).mockImplementation((args: any) => Promise.resolve({ id: 'msg-1', ...args.data }));

    const result = await controller.sendMessage(context, req);

    expect(result.message.userId).toBe('system-bot-id');
    expect(prisma.botApplication.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ workspaceId: 'ws-1' })
    }));
  });

  it('should use workspace default bot for M2M if organization ID user is used', async () => {
    const context: any = {
      workspaceId: 'ws-1',
      userId: 'org-1',
      clientId: 'org-client-1',
      organizationId: 'org-1',
      scopes: ['*']
    };
    const body = { channelId: 'chan-1', content: 'hello app' };
    const req: any = { isMultipart: () => false, body };

    (prisma.channel.findUnique as any).mockResolvedValue({ id: 'chan-1', workspaceId: 'ws-1' });
    (prisma.organization.findUnique as any).mockResolvedValue({ id: 'org-1' });
    (prisma.botApplication.findFirst as any).mockResolvedValue({ botId: 'system-bot-id' });
    (prisma.message.create as any).mockImplementation((args: any) => Promise.resolve({ id: 'msg-1', ...args.data }));

    const result = await controller.sendMessage(context, req);

    expect(result.message.userId).toBe('system-bot-id');
    expect(prisma.organization.findUnique).toHaveBeenCalledWith({
      where: { id: 'org-1' },
      select: { id: true }
    });
  });
});

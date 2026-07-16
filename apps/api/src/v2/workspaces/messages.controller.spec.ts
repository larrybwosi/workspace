import { Test, TestingModule } from '@nestjs/testing';
import { V2MessagesController } from './messages.controller';
import { prisma } from '@repo/database';
import * as sharedServer from '@repo/shared/server';
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
      findMany: vi.fn(),
    },
    botApplication: {
      findFirst: vi.fn(),
    },
    organization: {
      findUnique: vi.fn(),
    },
    thread: {
      findFirst: vi.fn(),
    },
    workspaceMember: {
      findUnique: vi.fn(),
    },
    directMessage: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock('@repo/shared/server', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    publishRealtime: vi.fn().mockResolvedValue(undefined),
    getAblyRest: vi.fn(),
  };
});

describe('V2MessagesController', () => {
  let controller: V2MessagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [V2MessagesController],
      providers: [
        { provide: 'REDIS_CLIENT', useValue: { get: vi.fn(), setex: vi.fn(), del: vi.fn(), incr: vi.fn(), expire: vi.fn() } },
        { provide: V2AuditService, useValue: { log: vi.fn().mockResolvedValue(undefined) } },
        { provide: V2WebhooksService, useValue: { dispatch: vi.fn().mockResolvedValue(undefined) } },
        { provide: StorageService, useValue: { uploadFile: vi.fn() } },
        { provide: ConfigService, useValue: { get: vi.fn() } },
      ],
    }).compile();

    controller = module.get<V2MessagesController>(V2MessagesController);
  });

  it('should call publishRealtime when sending a V2 message', async () => {
    const context: any = { workspaceId: 'ws-1', userId: 'user-1', scopes: ['*'] };
    const body = { channelId: 'chan-1', content: 'hello' };
    const req: any = { isMultipart: () => false, body };

    (prisma.channel.findUnique as any).mockResolvedValue({ id: 'chan-1', workspaceId: 'ws-1' });
    (prisma.message.create as any).mockResolvedValue({ id: 'msg-1', channelId: 'chan-1' });

    await controller.sendMessage(context, req);

    expect(sharedServer.publishRealtime).toHaveBeenCalled();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { V2AnnouncementsController } from './announcements.controller';
import { prisma } from '@repo/database';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { V2AuditService } from '../v2-audit.service';
import { ConfigService } from '@nestjs/config';

vi.mock('@repo/database', () => ({
  prisma: {
    workspaceDepartment: {
      update: vi.fn(),
    },
    botApplication: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

describe('V2AnnouncementsController M2M', () => {
  let controller: V2AnnouncementsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [V2AnnouncementsController],
      providers: [
        { provide: V2AuditService, useValue: { log: vi.fn().mockResolvedValue(undefined) } },
        { provide: 'REDIS_CLIENT', useValue: {} },
        { provide: ConfigService, useValue: {} },
      ],
    }).compile();

    controller = module.get<V2AnnouncementsController>(V2AnnouncementsController);
  });

  it('should use workspace default bot for M2M announcements', async () => {
    const context: any = {
      workspaceId: 'ws-1',
      userId: 'm2m:org-1',
      m2mClientId: 'm2m-client-1',
      organizationId: 'org-1',
      scopes: ['*']
    };
    const body = { departmentId: 'dept-1', title: 'System Alert', content: 'Maintenance' };

    (prisma.botApplication.findUnique as any).mockResolvedValue(null);
    (prisma.botApplication.findFirst as any).mockResolvedValue({ botId: 'system-bot-id' });
    (prisma.workspaceDepartment.update as any).mockImplementation((args: any) => Promise.resolve({
      announcements: [{ id: 'ann-1', ...args.data.announcements.create }]
    }));

    const result = await controller.createAnnouncement(context, body as any);

    expect(result.announcement.authorId).toBe('system-bot-id');
  });
});

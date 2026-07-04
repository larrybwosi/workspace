import { Test, TestingModule } from '@nestjs/testing';
import { ProvisioningController } from './provisioning.controller';
import { ProvisioningService } from './provisioning.service';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { prisma } from '@repo/database';
import { ConfigService } from '@nestjs/config';

vi.mock('@repo/database', () => ({
  prisma: {
    workspace: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    member: {
      findFirst: vi.fn(),
    },
    channel: {
      create: vi.fn(),
    },
    workspaceMember: {
      create: vi.fn(),
      upsert: vi.fn(),
    },
    botApplication: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    workspaceAuditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn().mockImplementation(async (cb) => cb(prisma)),
  },
}));

describe('ProvisioningController', () => {
  let controller: ProvisioningController;
  let service: ProvisioningService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProvisioningController],
      providers: [
        ProvisioningService,
        { provide: 'REDIS_CLIENT', useValue: {} },
        { provide: ConfigService, useValue: {} },
      ],
    }).compile();

    controller = module.get<ProvisioningController>(ProvisioningController);
    service = module.get<ProvisioningService>(ProvisioningService);
  });

  it('should provision a workspace successfully', async () => {
    const context = { scopes: ['provisioning:workspaces'], organizationId: 'org-1', userId: 'user-1' };
    const body = {
      name: 'Test Workspace',
      slug: 'test-ws',
      ownerEmail: 'owner@test.com',
    };

    (prisma.workspace.findUnique as any).mockResolvedValue(null);
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'owner-1', email: 'owner@test.com' });
    (prisma.member.findFirst as any).mockResolvedValue({ id: 'member-1' });
    (prisma.workspace.create as any).mockResolvedValue({ id: 'ws-1', slug: 'test-ws', name: 'Test Workspace' });
    (prisma.user.create as any).mockResolvedValue({ id: 'bot-1' });
    (prisma.botApplication.create as any).mockResolvedValue({ id: 'bot-app-1', clientId: 'c1', clientSecret: 's1' });

    const result = await controller.provisionWorkspace(context as any, body as any);

    expect(result.success).toBe(true);
    expect(result.workspace.id).toBe('ws-1');
    expect(prisma.workspace.create).toHaveBeenCalled();
  });

  it('should throw ForbiddenException if scope is missing', async () => {
    const context = { scopes: ['read:only'] };
    const body = { name: 'Test', slug: 'test', ownerEmail: 'test@test.com' };

    await expect(controller.provisionWorkspace(context as any, body as any)).rejects.toThrow(
      'Missing provisioning:workspaces scope'
    );
  });
});

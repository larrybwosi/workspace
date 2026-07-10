import { Test, TestingModule } from '@nestjs/testing';
import { V3WorkspacesController } from './v3-workspaces.controller';
import { ProvisioningService } from '../v2/provisioning.service';
import { ApiV3Guard } from '../auth/api-v3.guard';
import { ConfigService } from '@nestjs/config';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { prisma } from '@repo/database';

vi.mock('@repo/database', () => ({
  prisma: {
    workspace: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

describe('V3WorkspacesController', () => {
  let controller: V3WorkspacesController;
  let provisioningService: ProvisioningService;

  beforeEach(async () => {
    const mockProvisioningService = {
      provisionWorkspace: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [V3WorkspacesController],
      providers: [
        { provide: ProvisioningService, useValue: mockProvisioningService },
        { provide: 'REDIS_CLIENT', useValue: {} },
        { provide: ConfigService, useValue: {} },
        ApiV3Guard,
      ],
    }).compile();

    controller = module.get<V3WorkspacesController>(V3WorkspacesController);
    provisioningService = module.get<ProvisioningService>(ProvisioningService);

    vi.clearAllMocks();
  });

  describe('getWorkspaces', () => {
    it('should list workspaces associated with context organizationId', async () => {
      const context = {
        scopes: ['provisioning:workspaces'],
        organizationId: 'org-abc',
        userId: 'user-xyz',
      };

      const mockWorkspaces = [
        { id: 'ws-1', name: 'Acme', slug: 'acme', description: 'Acme Workspace', createdAt: new Date() },
      ];

      (prisma.workspace.findMany as any).mockResolvedValue(mockWorkspaces);

      const result = await controller.getWorkspaces(context as any);

      expect(result.workspaces).toBeDefined();
      expect(result.workspaces.length).toBe(1);
      expect(result.workspaces[0].name).toBe('Acme');
      expect(prisma.workspace.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-abc' },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          createdAt: true,
        },
      });
    });

    it('should list single workspace if organizationId is missing but workspaceId is present', async () => {
      const context = {
        scopes: ['*'],
        workspaceId: 'ws-single',
        userId: 'user-xyz',
      };

      const mockWorkspace = {
        id: 'ws-single',
        name: 'Single',
        slug: 'single',
        description: 'Single Workspace',
        createdAt: new Date(),
      };

      (prisma.workspace.findUnique as any).mockResolvedValue(mockWorkspace);

      const result = await controller.getWorkspaces(context as any);

      expect(result.workspaces).toBeDefined();
      expect(result.workspaces.length).toBe(1);
      expect(result.workspaces[0].name).toBe('Single');
      expect(prisma.workspace.findUnique).toHaveBeenCalledWith({
        where: { id: 'ws-single' },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          createdAt: true,
        },
      });
    });

    it('should throw ForbiddenException if missing required scope', async () => {
      const context = {
        scopes: ['messages:read'],
        organizationId: 'org-abc',
        userId: 'user-xyz',
      };

      await expect(controller.getWorkspaces(context as any)).rejects.toThrow(
        'Missing provisioning:workspaces scope'
      );
    });
  });

  describe('provisionWorkspace', () => {
    it('should delegate to provisioningService.provisionWorkspace if scopes allow', async () => {
      const context = {
        scopes: ['provisioning:workspaces'],
        organizationId: 'org-abc',
        userId: 'user-xyz',
      };

      const body = {
        name: 'New Workspace',
        slug: 'new-ws',
        ownerEmail: 'owner@acme.com',
      };

      const expectedResponse = {
        success: true,
        workspace: { id: 'ws-99', slug: 'new-ws', name: 'New Workspace' },
      };

      (provisioningService.provisionWorkspace as any).mockResolvedValue(expectedResponse);

      const result = await controller.provisionWorkspace(context as any, body as any);

      expect(result).toEqual(expectedResponse);
      expect(provisioningService.provisionWorkspace).toHaveBeenCalledWith(context, {
        name: 'New Workspace',
        slug: 'new-ws',
        ownerEmail: 'owner@acme.com',
        icon: 'building',
        channels: ['general', 'random'],
        initialMembers: [],
      });
    });

    it('should throw ForbiddenException for provisioning if missing required scope', async () => {
      const context = {
        scopes: ['messages:read'],
        organizationId: 'org-abc',
        userId: 'user-xyz',
      };

      const body = {
        name: 'New Workspace',
        slug: 'new-ws',
        ownerEmail: 'owner@acme.com',
      };

      await expect(controller.provisionWorkspace(context as any, body as any)).rejects.toThrow(
        'Missing provisioning:workspaces scope'
      );
    });
  });
});

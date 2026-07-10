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
      update: vi.fn(),
      delete: vi.fn(),
    },
    workspaceMember: {
      findFirst: vi.fn(),
    },
    workspaceAuditLog: {
      create: vi.fn(),
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
    it('should list workspaces associated with context organizationId in wrapped standard response', async () => {
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

      expect(result.success).toBe(true);
      expect(result.timestamp).toBeDefined();
      expect(result.data.workspaces).toBeDefined();
      expect(result.data.workspaces.length).toBe(1);
      expect(result.data.workspaces[0].name).toBe('Acme');
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

      expect(result.success).toBe(true);
      expect(result.data.workspaces).toBeDefined();
      expect(result.data.workspaces.length).toBe(1);
      expect(result.data.workspaces[0].name).toBe('Single');
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
    it('should delegate to provisioningService.provisionWorkspace and wrap result if scopes allow', async () => {
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

      const serviceResponse = {
        success: true,
        workspace: { id: 'ws-99', slug: 'new-ws', name: 'New Workspace' },
        bot: { id: 'bot-1', clientId: 'bot-client', clientSecret: 'bot-secret' },
      };

      (provisioningService.provisionWorkspace as any).mockResolvedValue(serviceResponse);

      const result = await controller.provisionWorkspace(context as any, body as any);

      expect(result.success).toBe(true);
      expect(result.timestamp).toBeDefined();
      expect(result.data.workspace).toEqual(serviceResponse.workspace);
      expect(result.data.bot).toEqual(serviceResponse.bot);
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

  describe('getWorkspaceBySlug', () => {
    it('should return workspace details by slug in wrapped standard response if authorized by organizationId', async () => {
      const context = {
        scopes: ['provisioning:workspaces'],
        organizationId: 'org-abc',
        userId: 'user-xyz',
      };

      const mockWorkspace = {
        id: 'ws-123',
        name: 'Acme',
        slug: 'acme-slug',
        description: 'Primary Acme',
        icon: 'building',
        industry: 'Software',
        brandingConfig: null,
        organizationId: 'org-abc',
        createdAt: new Date(),
      };

      (prisma.workspace.findUnique as any).mockResolvedValue(mockWorkspace);

      const result = await controller.getWorkspaceBySlug(context as any, 'acme-slug');

      expect(result.success).toBe(true);
      expect(result.data.workspace).toEqual({
        id: 'ws-123',
        name: 'Acme',
        slug: 'acme-slug',
        description: 'Primary Acme',
        icon: 'building',
        industry: 'Software',
        brandingConfig: null,
        createdAt: mockWorkspace.createdAt,
      });
      expect(prisma.workspace.findUnique).toHaveBeenCalledWith({
        where: { slug: 'acme-slug' },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          icon: true,
          industry: true,
          brandingConfig: true,
          organizationId: true,
          createdAt: true,
        },
      });
    });

    it('should throw ForbiddenException if organizationId does not match workspace organizationId', async () => {
      const context = {
        scopes: ['provisioning:workspaces'],
        organizationId: 'org-another',
        userId: 'user-xyz',
      };

      const mockWorkspace = {
        id: 'ws-123',
        name: 'Acme',
        slug: 'acme-slug',
        organizationId: 'org-abc',
      };

      (prisma.workspace.findUnique as any).mockResolvedValue(mockWorkspace);

      await expect(controller.getWorkspaceBySlug(context as any, 'acme-slug')).rejects.toThrow(
        'M2M application is not authorized to access this workspace'
      );
    });

    it('should throw NotFoundException if workspace is not found', async () => {
      const context = {
        scopes: ['provisioning:workspaces'],
        organizationId: 'org-abc',
        userId: 'user-xyz',
      };

      (prisma.workspace.findUnique as any).mockResolvedValue(null);

      await expect(controller.getWorkspaceBySlug(context as any, 'acme-slug')).rejects.toThrow(
        'Workspace with slug "acme-slug" not found'
      );
    });
  });

  describe('updateWorkspace', () => {
    it('should update workspace and return wrapped standard response', async () => {
      const context = {
        scopes: ['provisioning:workspaces'],
        organizationId: 'org-abc',
        userId: 'user-xyz',
        clientId: 'app-client-123',
      };

      const body = {
        name: 'Acme Updated',
        description: 'New Description',
      };

      const mockWorkspace = {
        id: 'ws-123',
        organizationId: 'org-abc',
      };

      const mockUpdatedWorkspace = {
        id: 'ws-123',
        name: 'Acme Updated',
        slug: 'acme-slug',
        description: 'New Description',
        icon: 'building',
        industry: 'Software',
        brandingConfig: null,
        updatedAt: new Date(),
      };

      (prisma.workspace.findUnique as any).mockResolvedValue(mockWorkspace);
      (prisma.workspace.update as any).mockResolvedValue(mockUpdatedWorkspace);

      const result = await controller.updateWorkspace(context as any, 'acme-slug', body);

      expect(result.success).toBe(true);
      expect(result.data.workspace).toEqual(mockUpdatedWorkspace);
      expect(prisma.workspace.findUnique).toHaveBeenCalledWith({
        where: { slug: 'acme-slug' },
        select: { id: true, organizationId: true },
      });
      expect(prisma.workspace.update).toHaveBeenCalledWith({
        where: { id: 'ws-123' },
        data: body,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          icon: true,
          industry: true,
          brandingConfig: true,
          updatedAt: true,
        },
      });
      expect(prisma.workspaceAuditLog.create).toHaveBeenCalled();
    });
  });

  describe('deleteWorkspace', () => {
    it('should delete workspace and return success standard response', async () => {
      const context = {
        scopes: ['*'],
        organizationId: 'org-abc',
        userId: 'user-xyz',
      };

      const mockWorkspace = {
        id: 'ws-123',
        organizationId: 'org-abc',
      };

      (prisma.workspace.findUnique as any).mockResolvedValue(mockWorkspace);
      (prisma.workspace.delete as any).mockResolvedValue({ id: 'ws-123' });

      const result = await controller.deleteWorkspace(context as any, 'acme-slug');

      expect(result.success).toBe(true);
      expect(result.data.success).toBe(true);
      expect(prisma.workspace.findUnique).toHaveBeenCalledWith({
        where: { slug: 'acme-slug' },
        select: { id: true, organizationId: true, ownerId: true },
      });
      expect(prisma.workspace.delete).toHaveBeenCalledWith({
        where: { id: 'ws-123' },
      });
    });
  });
});

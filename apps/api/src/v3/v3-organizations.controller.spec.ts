import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { V3OrganizationsController } from './v3-organizations.controller';
import { AuthGuard } from '../auth/auth.guard';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { prisma } from '@repo/database';

// Mock @repo/database prisma
vi.mock('@repo/database', () => ({
  prisma: {
    organization: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('V3OrganizationsController', () => {
  let controller: V3OrganizationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [V3OrganizationsController],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<V3OrganizationsController>(V3OrganizationsController);
    vi.clearAllMocks();
  });

  const mockUser = { id: 'user-1', name: 'Alice', email: 'alice@example.com' } as any;

  describe('getOrganizationWorkspaces', () => {
    it('should return workspaces formatted in V3 response structure if user is a member', async () => {
      const mockOrg = {
        id: 'org-1',
        members: [{ id: 'member-1' }],
        workspaces: [{ id: 'ws-1', name: 'Workspace 1' }],
      };

      (prisma.organization.findUnique as any).mockResolvedValue(mockOrg);

      const result = await controller.getOrganizationWorkspaces(mockUser, 'acme');

      expect(prisma.organization.findUnique).toHaveBeenCalledWith({
        where: { slug: 'acme' },
        select: expect.any(Object),
      });
      expect(result.success).toBe(true);
      expect(result.timestamp).toBeDefined();
      expect(result.data).toEqual({ workspaces: mockOrg.workspaces });
    });

    it('should throw NotFoundException if organization not found', async () => {
      (prisma.organization.findUnique as any).mockResolvedValue(null);

      await expect(controller.getOrganizationWorkspaces(mockUser, 'missing')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      const mockOrg = {
        id: 'org-1',
        members: [], // empty means not a member
        workspaces: [],
      };

      (prisma.organization.findUnique as any).mockResolvedValue(mockOrg);

      await expect(controller.getOrganizationWorkspaces(mockUser, 'acme')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getOrganization', () => {
    it('should return organization details formatted in V3 response structure if user is a member', async () => {
      const mockOrg = {
        id: 'org-1',
        name: 'Acme',
        slug: 'acme',
        members: [{ id: 'member-1' }],
      };

      (prisma.organization.findUnique as any).mockResolvedValue(mockOrg);

      const result = await controller.getOrganization(mockUser, 'acme');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ organization: mockOrg });
    });
  });

  describe('updateOrganization', () => {
    it('should update organization if user is owner/admin', async () => {
      const mockOrg = {
        id: 'org-1',
        members: [{ role: 'owner' }],
      };

      (prisma.organization.findUnique as any).mockResolvedValue(mockOrg);
      (prisma.organization.update as any).mockResolvedValue({ id: 'org-1', name: 'New Name' });

      const result = await controller.updateOrganization(mockUser, 'acme', { name: 'New Name' });

      expect(prisma.organization.update).toHaveBeenCalledWith({
        where: { id: 'org-1' },
        data: { name: 'New Name' },
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ organization: { id: 'org-1', name: 'New Name' } });
    });

    it('should throw ForbiddenException if member role is member', async () => {
      const mockOrg = {
        id: 'org-1',
        members: [{ role: 'member' }],
      };

      (prisma.organization.findUnique as any).mockResolvedValue(mockOrg);

      await expect(controller.updateOrganization(mockUser, 'acme', { name: 'New Name' })).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getM2mApplications', () => {
    it('should return M2M application list if organization has credentials', async () => {
      const mockOrg = {
        id: 'org-1',
        name: 'Acme',
        clientId: 'm2m_123',
        scopes: ['provisioning:workspaces'],
        allowedIps: [],
        createdAt: new Date('2026-01-01'),
        members: [{ role: 'owner' }],
      };

      (prisma.organization.findUnique as any).mockResolvedValue(mockOrg);

      const result = await controller.getM2mApplications(mockUser, 'acme');

      expect(result.success).toBe(true);
      expect(result.data.applications).toHaveLength(1);
      expect(result.data.applications[0].clientId).toBe('m2m_123');
    });

    it('should return empty list if organization has no credentials', async () => {
      const mockOrg = {
        id: 'org-1',
        name: 'Acme',
        clientId: null,
        members: [{ role: 'owner' }],
      };

      (prisma.organization.findUnique as any).mockResolvedValue(mockOrg);

      const result = await controller.getM2mApplications(mockUser, 'acme');

      expect(result.success).toBe(true);
      expect(result.data.applications).toEqual([]);
    });
  });

  describe('createM2mApplication', () => {
    it('should create and return M2M credentials formatted in V3 response structure', async () => {
      const mockOrg = {
        id: 'org-1',
        name: 'Acme',
        members: [{ role: 'owner' }],
      };

      (prisma.organization.findUnique as any).mockResolvedValue(mockOrg);
      (prisma.organization.update as any).mockResolvedValue({
        id: 'org-1',
        clientId: 'm2m_generated',
        scopes: ['provisioning:workspaces'],
        allowedIps: [],
        createdAt: new Date('2026-01-01'),
      });

      const result = await controller.createM2mApplication(mockUser, 'acme', {
        name: 'CI App',
      });

      expect(result.success).toBe(true);
      expect(result.data.clientId).toBeDefined();
      expect(result.data.clientSecret).toMatch(/^sk_m2m_/);
      expect(result.data.name).toBe('CI App');
    });
  });

  describe('updateM2mApplication', () => {
    it('should update name, scopes, and allowedIps', async () => {
      const mockOrg = {
        id: 'org-1',
        name: 'Acme',
        clientId: 'm2m_123',
        scopes: ['provisioning:workspaces'],
        allowedIps: [],
        createdAt: new Date('2026-01-01'),
        members: [{ role: 'admin' }],
      };

      (prisma.organization.findUnique as any).mockResolvedValue(mockOrg);
      (prisma.organization.update as any).mockResolvedValue({
        id: 'org-1',
        name: 'Updated CI App',
        clientId: 'm2m_123',
        scopes: ['provisioning:workspaces', 'messages:send'],
        allowedIps: ['192.168.1.1'],
        createdAt: new Date('2026-01-01'),
      });

      const result = await controller.updateM2mApplication(mockUser, 'acme', 'org-1', {
        name: 'Updated CI App',
        scopes: ['provisioning:workspaces', 'messages:send'],
        allowedIps: ['192.168.1.1'],
      });

      expect(prisma.organization.update).toHaveBeenCalledWith({
        where: { id: 'org-1' },
        data: {
          name: 'Updated CI App',
          scopes: ['provisioning:workspaces', 'messages:send'],
          allowedIps: ['192.168.1.1'],
        },
        select: expect.any(Object),
      });
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Updated CI App');
      expect(result.data.scopes).toEqual(['provisioning:workspaces', 'messages:send']);
    });
  });

  describe('deleteM2mApplication', () => {
    it('should clear M2M credentials', async () => {
      const mockOrg = {
        id: 'org-1',
        members: [{ role: 'admin' }],
      };

      (prisma.organization.findUnique as any).mockResolvedValue(mockOrg);
      (prisma.organization.update as any).mockResolvedValue({});

      const result = await controller.deleteM2mApplication(mockUser, 'acme', 'org-1');

      expect(prisma.organization.update).toHaveBeenCalledWith({
        where: { id: 'org-1' },
        data: {
          clientId: null,
          clientSecret: null,
          scopes: [],
          allowedIps: [],
        },
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ success: true });
    });
  });
});

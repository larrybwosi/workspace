import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsController } from './organizations.controller';
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

describe('OrganizationsController', () => {
  let controller: OrganizationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationsController],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<OrganizationsController>(OrganizationsController);
    vi.clearAllMocks();
  });

  const mockUser = { id: 'user-1', name: 'Alice', email: 'alice@example.com' } as any;

  describe('getOrganizationWorkspaces', () => {
    it('should return workspaces if user is a member', async () => {
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
      expect(result).toEqual({ workspaces: mockOrg.workspaces });
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
    it('should return organization details if user is a member', async () => {
      const mockOrg = {
        id: 'org-1',
        name: 'Acme',
        slug: 'acme',
        members: [{ id: 'member-1' }],
      };

      (prisma.organization.findUnique as any).mockResolvedValue(mockOrg);

      const result = await controller.getOrganization(mockUser, 'acme');

      expect(result).toEqual({ organization: mockOrg });
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
      expect(result).toEqual({ organization: { id: 'org-1', name: 'New Name' } });
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
});

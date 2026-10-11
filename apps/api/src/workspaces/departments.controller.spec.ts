import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentsController } from './departments.controller';
import { AuthGuard } from '../auth/auth.guard';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

// Mock @repo/database prisma
vi.mock('@repo/database', () => ({
  prisma: {
    workspace: {
      findUnique: vi.fn(),
    },
    workspaceDepartment: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    departmentAnnouncement: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    workspaceAuditLog: {
      create: vi.fn().mockReturnValue({ catch: vi.fn() }),
    },
  },
}));

// Mock @repo/shared/server
vi.mock('@repo/shared/server', () => ({
  AblyChannels: {
    workspace: vi.fn((id: string) => `workspace:${id}`),
  },
  EVENTS: {
    WORKSPACE_UPDATED: 'workspace.updated',
  },
  getAblyServer: vi.fn().mockReturnValue(null),
}));

import { prisma } from '@repo/database';

describe('DepartmentsController', () => {
  let controller: DepartmentsController;

  beforeEach(async () => {
    vi.clearAllMocks();
    (prisma.workspaceAuditLog.create as any).mockReturnValue({ catch: vi.fn() });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepartmentsController],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DepartmentsController>(DepartmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDepartment', () => {
    it('should retrieve a department via direct findUnique and exclude workspace relation from result', async () => {
      const mockPrisma = prisma as any;
      mockPrisma.workspaceDepartment.findUnique.mockResolvedValue({
        id: 'dept-1',
        name: 'Engineering',
        slug: 'engineering',
        workspace: {
          id: 'ws-1',
          slug: 'my-workspace',
          members: [{ role: 'member' }],
        },
        members: [],
        teams: [],
        announcements: [],
        _count: { members: 0, teams: 0, announcements: 0 },
      });

      const user = { id: 'user-1', name: 'Alice' } as any;
      const result = await controller.getDepartment(user, 'my-workspace', 'dept-1');

      expect(mockPrisma.workspaceDepartment.findUnique).toHaveBeenCalledWith({
        where: { id: 'dept-1' },
        include: expect.objectContaining({
          workspace: {
            select: {
              id: true,
              slug: true,
              members: {
                where: { userId: user.id },
                select: { role: true },
              },
            },
          },
        }),
      });

      expect(result).not.toHaveProperty('workspace');
      expect(result.id).toBe('dept-1');
      expect(result.name).toBe('Engineering');
    });

    it('should throw NotFoundException if department does not exist', async () => {
      const mockPrisma = prisma as any;
      mockPrisma.workspaceDepartment.findUnique.mockResolvedValue(null);

      const user = { id: 'user-1', name: 'Alice' } as any;
      await expect(controller.getDepartment(user, 'my-workspace', 'dept-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if department workspace slug does not match the slug param', async () => {
      const mockPrisma = prisma as any;
      mockPrisma.workspaceDepartment.findUnique.mockResolvedValue({
        id: 'dept-1',
        name: 'Engineering',
        workspace: {
          id: 'ws-1',
          slug: 'other-workspace',
          members: [{ role: 'member' }],
        },
      });

      const user = { id: 'user-1', name: 'Alice' } as any;
      await expect(controller.getDepartment(user, 'my-workspace', 'dept-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not a member of the workspace', async () => {
      const mockPrisma = prisma as any;
      mockPrisma.workspaceDepartment.findUnique.mockResolvedValue({
        id: 'dept-1',
        name: 'Engineering',
        workspace: {
          id: 'ws-1',
          slug: 'my-workspace',
          members: [], // empty membership
        },
      });

      const user = { id: 'user-1', name: 'Alice' } as any;
      await expect(controller.getDepartment(user, 'my-workspace', 'dept-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateDepartment', () => {
    it('should update department via single workspaceDepartment findUnique point lookup', async () => {
      const mockPrisma = prisma as any;
      mockPrisma.workspaceDepartment.findUnique.mockResolvedValue({
        id: 'dept-1',
        workspaceId: 'ws-1',
        workspace: {
          id: 'ws-1',
          slug: 'my-workspace',
          members: [{ role: 'admin' }],
        },
      });
      mockPrisma.workspaceDepartment.update.mockResolvedValue({
        id: 'dept-1',
        name: 'Updated Name',
      });

      const user = { id: 'user-admin', name: 'Admin' } as any;
      const result = await controller.updateDepartment(user, 'my-workspace', 'dept-1', { name: 'Updated Name' });

      expect(mockPrisma.workspaceDepartment.findUnique).toHaveBeenCalledWith({
        where: { id: 'dept-1' },
        select: expect.objectContaining({
          workspace: expect.objectContaining({
            select: expect.objectContaining({
              slug: true,
            }),
          }),
        }),
      });
      expect(result.name).toBe('Updated Name');
    });

    it('should throw NotFoundException if department does not belong to the target workspace slug', async () => {
      const mockPrisma = prisma as any;
      mockPrisma.workspaceDepartment.findUnique.mockResolvedValue({
        id: 'dept-1',
        workspaceId: 'ws-OTHER',
        workspace: {
          id: 'ws-OTHER',
          slug: 'other-workspace', // mismatch
          members: [{ role: 'admin' }],
        },
      });

      const user = { id: 'user-admin', name: 'Admin' } as any;
      await expect(
        controller.updateDepartment(user, 'my-workspace', 'dept-1', { name: 'New Name' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not an admin or owner', async () => {
      const mockPrisma = prisma as any;
      mockPrisma.workspaceDepartment.findUnique.mockResolvedValue({
        id: 'dept-1',
        workspaceId: 'ws-1',
        workspace: {
          id: 'ws-1',
          slug: 'my-workspace',
          members: [{ role: 'member' }], // member, not admin
        },
      });

      const user = { id: 'user-member', name: 'Member' } as any;
      await expect(
        controller.updateDepartment(user, 'my-workspace', 'dept-1', { name: 'New Name' })
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteDepartment', () => {
    it('should delete department via single workspaceDepartment findUnique point lookup', async () => {
      const mockPrisma = prisma as any;
      mockPrisma.workspaceDepartment.findUnique.mockResolvedValue({
        id: 'dept-1',
        workspaceId: 'ws-1',
        workspace: {
          id: 'ws-1',
          slug: 'my-workspace',
          members: [{ role: 'owner' }],
        },
      });
      mockPrisma.workspaceDepartment.delete.mockResolvedValue({ id: 'dept-1' });

      const user = { id: 'user-owner', name: 'Owner' } as any;
      const result = await controller.deleteDepartment(user, 'my-workspace', 'dept-1');

      expect(mockPrisma.workspaceDepartment.findUnique).toHaveBeenCalledWith({
        where: { id: 'dept-1' },
        select: expect.objectContaining({
          workspace: expect.any(Object),
        }),
      });
      expect(mockPrisma.workspaceDepartment.delete).toHaveBeenCalledWith({ where: { id: 'dept-1' } });
      expect(result).toEqual({ success: true });
    });

    it('should throw NotFoundException if department does not belong to the target workspace slug', async () => {
      const mockPrisma = prisma as any;
      mockPrisma.workspaceDepartment.findUnique.mockResolvedValue({
        id: 'dept-1',
        workspaceId: 'ws-OTHER',
        workspace: {
          id: 'ws-OTHER',
          slug: 'other-workspace', // mismatch
          members: [{ role: 'admin' }],
        },
      });

      const user = { id: 'user-admin', name: 'Admin' } as any;
      await expect(controller.deleteDepartment(user, 'my-workspace', 'dept-1')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw ForbiddenException if user is not an admin/owner', async () => {
      const mockPrisma = prisma as any;
      mockPrisma.workspaceDepartment.findUnique.mockResolvedValue({
        id: 'dept-1',
        workspaceId: 'ws-1',
        workspace: {
          id: 'ws-1',
          slug: 'my-workspace',
          members: [{ role: 'member' }],
        },
      });

      const user = { id: 'user-member', name: 'Member' } as any;
      await expect(controller.deleteDepartment(user, 'my-workspace', 'dept-1')).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('getAnnouncements', () => {
    it('should retrieve announcements via single workspaceDepartment findUnique point lookup', async () => {
      const mockPrisma = prisma as any;
      mockPrisma.workspaceDepartment.findUnique.mockResolvedValue({
        id: 'dept-1',
        workspaceId: 'ws-1',
        workspace: {
          id: 'ws-1',
          slug: 'my-workspace',
          members: [{ role: 'member' }],
        },
      });
      mockPrisma.departmentAnnouncement.findMany.mockResolvedValue([
        { id: 'ann-1', title: 'Office Holiday', content: 'Closed on Monday' },
      ]);
      mockPrisma.departmentAnnouncement.count.mockResolvedValue(1);

      const user = { id: 'user-1', name: 'Alice' } as any;
      const result = await controller.getAnnouncements(user, 'my-workspace', 'dept-1');

      expect(mockPrisma.workspaceDepartment.findUnique).toHaveBeenCalledWith({
        where: { id: 'dept-1' },
        select: expect.objectContaining({
          workspace: expect.any(Object),
        }),
      });
      expect(result.announcements).toHaveLength(1);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
    });

    it('should throw NotFoundException if department does not belong to the target workspace slug', async () => {
      const mockPrisma = prisma as any;
      mockPrisma.workspaceDepartment.findUnique.mockResolvedValue({
        id: 'dept-1',
        workspaceId: 'ws-OTHER',
        workspace: {
          id: 'ws-OTHER',
          slug: 'other-workspace',
          members: [{ role: 'member' }],
        },
      });

      const user = { id: 'user-1', name: 'Alice' } as any;
      await expect(controller.getAnnouncements(user, 'my-workspace', 'dept-1')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw ForbiddenException if user is not a workspace member', async () => {
      const mockPrisma = prisma as any;
      mockPrisma.workspaceDepartment.findUnique.mockResolvedValue({
        id: 'dept-1',
        workspaceId: 'ws-1',
        workspace: {
          id: 'ws-1',
          slug: 'my-workspace',
          members: [], // non-member
        },
      });

      const user = { id: 'user-1', name: 'Alice' } as any;
      await expect(controller.getAnnouncements(user, 'my-workspace', 'dept-1')).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('createAnnouncement workspace boundary enforcement', () => {
    it('should throw NotFoundException if department does not belong to the target workspace', async () => {
      const mockPrisma = prisma as any;
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: 'ws-1',
        members: [{ role: 'admin' }],
        departments: [], // department not found under ws-1
      });

      const user = { id: 'user-admin', name: 'Admin' } as any;
      await expect(
        controller.createAnnouncement(user, 'my-workspace', 'dept-1', {
          title: 'Test Announcement',
          content: 'Test content',
        })
      ).rejects.toThrow(NotFoundException);
    });
  });
});

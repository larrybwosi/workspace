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
    workspaceAuditLog: {
      create: vi.fn(),
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
});

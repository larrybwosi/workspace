import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { V2WorkspacesController } from './workspaces.controller';
import { ApiV2Guard } from '../../auth/api-v2.guard';
import { V2AuditService } from '../v2-audit.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { prisma } from '@repo/database';

// Mock @repo/database prisma
vi.mock('@repo/database', () => ({
  prisma: {
    workspaceMember: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    workspace: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock V2AuditService
const mockAuditService = {
  log: vi.fn().mockResolvedValue(undefined),
};

// Mock Redis
const mockRedis = {
  get: vi.fn().mockResolvedValue(null),
  setex: vi.fn().mockResolvedValue('OK'),
  del: vi.fn().mockResolvedValue(1),
};

describe('V2WorkspacesController', () => {
  let controller: V2WorkspacesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [V2WorkspacesController],
      providers: [
        { provide: V2AuditService, useValue: mockAuditService },
        { provide: 'REDIS_CLIENT', useValue: mockRedis },
      ],
    })
      .overrideGuard(ApiV2Guard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<V2WorkspacesController>(V2WorkspacesController);
    vi.clearAllMocks();
  });

  const mockContext = {
    userId: 'user-1',
    workspaceId: 'ws-1',
    workspaceSlug: 'my-workspace',
    scopes: ['*'],
  } as any;

  describe('getMember', () => {
    it('should return member details using findUnique and O(1) lookup', async () => {
      const mockMember = {
        id: 'member-1',
        userId: 'user-2',
        user: { id: 'user-2', name: 'Bob' },
      };

      (prisma.workspaceMember.findUnique as any).mockResolvedValue(mockMember);

      const result = await controller.getMember(mockContext, 'user-2');

      expect(prisma.workspaceMember.findUnique).toHaveBeenCalledWith({
        where: {
          workspaceId_userId: {
            workspaceId: 'ws-1',
            userId: 'user-2',
          },
        },
        select: expect.any(Object),
      });
      expect(result).toEqual({ member: mockMember });
    });

    it('should throw NotFoundException if member not found', async () => {
      (prisma.workspaceMember.findUnique as any).mockResolvedValue(null);

      await expect(controller.getMember(mockContext, 'user-3')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if missing scope', async () => {
      const restrictedContext = { ...mockContext, scopes: [] };
      await expect(controller.getMember(restrictedContext, 'user-2')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeMember', () => {
    it('should remove a member using consolidated checks and compound index delete', async () => {
      const mockWorkspace = {
        ownerId: 'user-1',
        members: [{ id: 'member-2' }],
      };

      (prisma.workspace.findUnique as any).mockResolvedValue(mockWorkspace);
      (prisma.workspaceMember.delete as any).mockResolvedValue({ id: 'member-2' });

      const result = await controller.removeMember(mockContext, 'user-2');

      expect(prisma.workspace.findUnique).toHaveBeenCalledWith({
        where: { id: 'ws-1' },
        select: {
          ownerId: true,
          members: {
            where: { userId: 'user-2' },
            select: { id: true },
          },
        },
      });

      expect(prisma.workspaceMember.delete).toHaveBeenCalledWith({
        where: {
          workspaceId_userId: {
            workspaceId: 'ws-1',
            userId: 'user-2',
          },
        },
      });

      expect(result).toEqual({ success: true });
    });

    it('should throw BadRequestException when trying to remove owner', async () => {
      const mockWorkspace = {
        ownerId: 'user-1',
        members: [{ id: 'member-1' }],
      };

      (prisma.workspace.findUnique as any).mockResolvedValue(mockWorkspace);

      await expect(controller.removeMember(mockContext, 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if member not in workspace', async () => {
      const mockWorkspace = {
        ownerId: 'user-1',
        members: [], // User not found
      };

      (prisma.workspace.findUnique as any).mockResolvedValue(mockWorkspace);

      await expect(controller.removeMember(mockContext, 'user-2')).rejects.toThrow(NotFoundException);
    });
  });
});

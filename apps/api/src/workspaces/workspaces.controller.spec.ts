import { Test, TestingModule } from '@nestjs/testing';
import { WorkspacesController } from './workspaces.controller';
import { prisma, type User } from '@repo/database';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { vi, describe, beforeEach, it, expect } from 'vitest';

vi.mock('@repo/database', () => ({
  prisma: {
    workspace: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    workspaceMember: {
      create: vi.fn(),
    },
    workspaceAuditLog: {
      create: vi.fn(),
    },
  },
}));

describe('WorkspacesController', () => {
  let controller: WorkspacesController;

  const mockUser: User = {
    id: 'user_1',
    email: 'test@example.com',
    name: 'Test User',
    avatar: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'online',
    customStatus: null,
    statusText: null,
    passwordHash: null,
    emailVerified: true,
    twoFactorEnabled: false,
    role: 'user',
    bot: false,
    appId: null,
    bio: null,
    displayUsername: null,
    username: 'testuser',
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkspacesController],
    }).compile();

    controller = module.get<WorkspacesController>(WorkspacesController);
  });

  describe('joinWorkspace', () => {
    it('should allow user to join a public workspace', async () => {
      const publicWorkspace = {
        id: 'ws_public',
        slug: 'public-ws',
        isPublic: true,
        members: [],
      };

      const newMember = {
        id: 'mem_1',
        workspaceId: 'ws_public',
        userId: 'user_1',
        role: 'member',
      };

      vi.mocked(prisma.workspace.findUnique).mockResolvedValue(publicWorkspace as any);
      vi.mocked(prisma.workspaceMember.create).mockResolvedValue(newMember as any);

      const result = await controller.joinWorkspace(mockUser, 'public-ws');

      expect(prisma.workspace.findUnique).toHaveBeenCalledWith({
        where: { slug: 'public-ws' },
        include: {
          members: {
            where: { userId: 'user_1' },
          },
        },
      });
      expect(prisma.workspaceMember.create).toHaveBeenCalledWith({
        data: {
          workspaceId: 'ws_public',
          userId: 'user_1',
          role: 'member',
        },
      });
      expect(result).toEqual(newMember);
    });

    it('should throw ForbiddenException when joining a private workspace as a non-member', async () => {
      const privateWorkspace = {
        id: 'ws_private',
        slug: 'private-ws',
        isPublic: false,
        members: [],
      };

      vi.mocked(prisma.workspace.findUnique).mockResolvedValue(privateWorkspace as any);

      await expect(controller.joinWorkspace(mockUser, 'private-ws')).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.workspaceMember.create).not.toHaveBeenCalled();
    });

    it('should return existing member record if user is already a member of a private workspace', async () => {
      const existingMember = {
        id: 'mem_existing',
        workspaceId: 'ws_private',
        userId: 'user_1',
        role: 'member',
      };

      const privateWorkspaceWithMember = {
        id: 'ws_private',
        slug: 'private-ws',
        isPublic: false,
        members: [existingMember],
      };

      vi.mocked(prisma.workspace.findUnique).mockResolvedValue(privateWorkspaceWithMember as any);

      const result = await controller.joinWorkspace(mockUser, 'private-ws');

      expect(result).toEqual(existingMember);
      expect(prisma.workspaceMember.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if workspace does not exist', async () => {
      vi.mocked(prisma.workspace.findUnique).mockResolvedValue(null);

      await expect(controller.joinWorkspace(mockUser, 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

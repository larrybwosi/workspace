import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { MembersController } from './members.controller';
import { AuthGuard } from '../auth/auth.guard';
import { prisma } from '@repo/database';

// Mock @repo/database prisma
vi.mock('@repo/database', () => ({
  prisma: {
    workspace: {
      findUnique: vi.fn(),
    },
    workspaceMember: {
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
  publishRealtime: vi.fn().mockResolvedValue(undefined),
  AblyChannels: {
    user: (id: string) => `user:${id}`,
  },
}));

describe('MembersController', () => {
  let controller: MembersController;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MembersController],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<MembersController>(MembersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getWorkspaceMembers', () => {
    const mockUser = { id: 'user-1', name: 'Alice', username: 'alice' } as any;

    it('should throw NotFoundException when workspace not found', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue(null);

      await expect(
        controller.getWorkspaceMembers(mockUser, 'non-existent-slug')
      ).rejects.toThrow('Workspace not found');
    });

    it('should throw ForbiddenException when user is not a member of the workspace', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue({
        id: 'ws-1',
        members: [
          {
            id: 'member-2',
            userId: 'user-2',
            user: { id: 'user-2', name: 'Bob', avatar: null, image: null },
          },
        ],
      });

      await expect(
        controller.getWorkspaceMembers(mockUser, 'my-workspace')
      ).rejects.toThrow('Access denied');
    });

    it('should return mapped members and apply standardized avatar mapping', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue({
        id: 'ws-1',
        members: [
          {
            id: 'member-1',
            userId: 'user-1',
            role: 'owner',
            user: {
              id: 'user-1',
              name: 'Alice',
              email: 'alice@example.com',
              avatar: null,
              image: 'https://avatar-fallback-url-1',
              status: 'online',
            },
          },
          {
            id: 'member-2',
            userId: 'user-2',
            role: 'member',
            user: {
              id: 'user-2',
              name: 'Bob',
              email: 'bob@example.com',
              avatar: 'https://custom-avatar-url-2',
              image: null,
              status: 'offline',
            },
          },
          {
            id: 'member-3',
            userId: 'user-3',
            role: 'guest',
            user: null, // Test edge case where user object might be null
          },
        ],
      });

      const response = await controller.getWorkspaceMembers(mockUser, 'my-workspace');

      expect(response.members).toHaveLength(3);

      // Verify standardized member 1 (image fallback used as avatar)
      expect(response.members[0].user).toEqual({
        id: 'user-1',
        name: 'Alice',
        email: 'alice@example.com',
        avatar: 'https://avatar-fallback-url-1',
        status: 'online',
      });
      expect(response.members[0].user).not.toHaveProperty('image');

      // Verify standardized member 2 (avatar used directly)
      expect(response.members[1].user).toEqual({
        id: 'user-2',
        name: 'Bob',
        email: 'bob@example.com',
        avatar: 'https://custom-avatar-url-2',
        status: 'offline',
      });
      expect(response.members[1].user).not.toHaveProperty('image');

      // Verify standardized member 3 (null user remains null)
      expect(response.members[2].user).toBeNull();
    });
  });
});

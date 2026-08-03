import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { InviteLinksController } from './invite-links.controller';
import { AuthGuard } from '../auth/auth.guard';
import { prisma } from '@repo/database';

// Mock @repo/database prisma
vi.mock('@repo/database', () => ({
  prisma: {
    workspace: {
      findUnique: vi.fn(),
    },
    workspaceInviteLink: {
      create: vi.fn(),
    },
  },
}));

describe('InviteLinksController', () => {
  let controller: InviteLinksController;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InviteLinksController],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<InviteLinksController>(InviteLinksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  const mockUser = { id: 'user-1', name: 'Alice', username: 'alice' } as any;

  describe('getInviteLinks', () => {
    it('should throw NotFoundException when workspace not found', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue(null);

      await expect(
        controller.getInviteLinks(mockUser, 'non-existent-slug')
      ).rejects.toThrow('Workspace not found');
    });

    it('should throw ForbiddenException when user is not a member of the workspace', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue({
        id: 'ws-1',
        members: [],
        inviteLinks: [],
      });

      await expect(
        controller.getInviteLinks(mockUser, 'my-workspace')
      ).rejects.toThrow('Access denied');
    });

    it('should return workspace invite links when user is a member', async () => {
      const mockInviteLinks = [
        {
          id: 'link-1',
          code: 'code123',
          maxUses: 0,
          uses: 0,
          expiresAt: null,
          createdAt: new Date(),
          createdBy: {
            id: 'user-1',
            name: 'Alice',
            avatar: null,
          },
        },
      ];

      (prisma.workspace.findUnique as any).mockResolvedValue({
        id: 'ws-1',
        members: [{ role: 'owner' }],
        inviteLinks: mockInviteLinks,
      });

      const result = await controller.getInviteLinks(mockUser, 'my-workspace');
      expect(result).toEqual(mockInviteLinks);
      expect(prisma.workspace.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { slug: 'my-workspace' },
        })
      );
    });
  });

  describe('createInviteLink', () => {
    it('should throw NotFoundException when workspace not found', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue(null);

      await expect(
        controller.createInviteLink(mockUser, 'non-existent-slug', {})
      ).rejects.toThrow('Workspace not found');
    });

    it('should throw ForbiddenException when user is not a member of the workspace', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue({
        id: 'ws-1',
        members: [],
        inviteLinks: [],
      });

      await expect(
        controller.createInviteLink(mockUser, 'my-workspace', {})
      ).rejects.toThrow('Access denied');
    });

    it('should return existing invite link if it already exists', async () => {
      const mockExistingLink = {
        id: 'link-1',
        code: 'code123',
        maxUses: 0,
        uses: 0,
        expiresAt: null,
        createdAt: new Date(),
        createdBy: {
          id: 'user-1',
          name: 'Alice',
          avatar: null,
        },
      };

      (prisma.workspace.findUnique as any).mockResolvedValue({
        id: 'ws-1',
        members: [{ role: 'owner' }],
        inviteLinks: [mockExistingLink],
      });

      const result = await controller.createInviteLink(mockUser, 'my-workspace', {});
      expect(result).toEqual(mockExistingLink);
      expect(prisma.workspaceInviteLink.create).not.toHaveBeenCalled();
    });

    it('should create and return a new invite link if none exists', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue({
        id: 'ws-1',
        members: [{ role: 'owner' }],
        inviteLinks: [], // No existing link
      });

      const mockNewLink = {
        id: 'link-new',
        code: 'newcode123',
        maxUses: 5,
        uses: 0,
        expiresAt: new Date('2026-12-31T23:59:59.000Z'),
        createdAt: new Date(),
        createdBy: {
          id: 'user-1',
          name: 'Alice',
          avatar: null,
        },
      };

      (prisma.workspaceInviteLink.create as any).mockResolvedValue(mockNewLink);

      const dto = {
        maxUses: 5,
        expiresAt: '2026-12-31T23:59:59.000Z',
      };

      const result = await controller.createInviteLink(mockUser, 'my-workspace', dto);
      expect(result).toEqual(mockNewLink);
      expect(prisma.workspaceInviteLink.create).toHaveBeenCalledWith({
        data: {
          workspaceId: 'ws-1',
          code: expect.any(String),
          maxUses: 5,
          expiresAt: new Date('2026-12-31T23:59:59.000Z'),
          createdById: 'user-1',
        },
        select: expect.any(Object),
      });
    });
  });
});

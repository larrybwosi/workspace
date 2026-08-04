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

  describe('getInviteLinks', () => {
    const mockUser = { id: 'user-1', name: 'Alice' } as any;

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

    it('should return invite links list successfully', async () => {
      const mockInviteLinks = [
        {
          id: 'link-1',
          code: 'abcde12345',
          maxUses: 0,
          uses: 2,
          expiresAt: null,
          createdAt: new Date(),
          createdBy: { id: 'user-1', name: 'Alice', avatar: null },
        },
      ];

      (prisma.workspace.findUnique as any).mockResolvedValue({
        id: 'ws-1',
        members: [{ role: 'admin' }],
        inviteLinks: mockInviteLinks,
      });

      const response = await controller.getInviteLinks(mockUser, 'my-workspace');
      expect(response).toEqual(mockInviteLinks);
      expect(prisma.workspace.findUnique).toHaveBeenCalledWith({
        where: { slug: 'my-workspace' },
        select: expect.objectContaining({
          id: true,
          members: {
            where: { userId: 'user-1' },
            select: { role: true },
          },
          inviteLinks: expect.any(Object),
        }),
      });
    });
  });

  describe('createInviteLink', () => {
    const mockUser = { id: 'user-1', name: 'Alice' } as any;
    const createDto = { maxUses: 5, expiresAt: '2026-12-31T23:59:59.000Z' };

    it('should throw NotFoundException when workspace not found', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue(null);

      await expect(
        controller.createInviteLink(mockUser, 'non-existent-slug', createDto)
      ).rejects.toThrow('Workspace not found');
    });

    it('should throw ForbiddenException when user is not a member of the workspace', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue({
        id: 'ws-1',
        members: [],
        inviteLinks: [],
      });

      await expect(
        controller.createInviteLink(mockUser, 'my-workspace', createDto)
      ).rejects.toThrow('Access denied');
    });

    it('should return existing link if the user already has created one', async () => {
      const existingLink = {
        id: 'link-existing',
        code: 'existing123',
        maxUses: 0,
        uses: 0,
        expiresAt: null,
        createdAt: new Date(),
        createdBy: { id: 'user-1', name: 'Alice', avatar: null },
      };

      (prisma.workspace.findUnique as any).mockResolvedValue({
        id: 'ws-1',
        members: [{ role: 'member' }],
        inviteLinks: [existingLink],
      });

      const response = await controller.createInviteLink(mockUser, 'my-workspace', createDto);
      expect(response).toEqual(existingLink);
      expect(prisma.workspaceInviteLink.create).not.toHaveBeenCalled();
    });

    it('should create and return a new invite link if no existing link is found', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue({
        id: 'ws-1',
        members: [{ role: 'member' }],
        inviteLinks: [], // Empty, no existing link
      });

      const newLink = {
        id: 'link-new',
        code: 'randomcode',
        maxUses: 5,
        uses: 0,
        expiresAt: new Date(createDto.expiresAt),
        createdAt: new Date(),
        createdBy: { id: 'user-1', name: 'Alice', avatar: null },
      };

      (prisma.workspaceInviteLink.create as any).mockResolvedValue(newLink);

      const response = await controller.createInviteLink(mockUser, 'my-workspace', createDto);
      expect(response).toEqual(newLink);
      expect(prisma.workspaceInviteLink.create).toHaveBeenCalledWith({
        data: {
          workspaceId: 'ws-1',
          code: expect.any(String),
          maxUses: 5,
          expiresAt: expect.any(Date),
          createdById: 'user-1',
        },
        select: {
          id: true,
          code: true,
          maxUses: true,
          uses: true,
          expiresAt: true,
          createdAt: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      });
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { InvitationsService } from './invitations.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

// Mock @repo/database
vi.mock('@repo/database', () => ({
  prisma: {
    workspace: {
      findUnique: vi.fn(),
    },
    workspaceInvitation: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    invitation: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    workspaceMember: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    workspaceInviteLink: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    friend: {
      upsert: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(vi.mocked(prisma))),
  },
}));

// Mock NotificationsService
const mockNotificationsService = {
  createNotification: vi.fn(),
};

import { prisma } from '@repo/database';

describe('InvitationsService', () => {
  let service: InvitationsService;
  const mockPrisma = prisma as any;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationsService,
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<InvitationsService>(InvitationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getInvitations', () => {
    const userId = 'user-1';
    const workspaceId = 'workspace-1';

    it('should fetch platform-wide invitations when workspaceId is not provided', async () => {
      const mockInvitations = [{ id: 'inv-1', email: 'test@example.com' }];
      mockPrisma.invitation.findMany.mockResolvedValue(mockInvitations);

      const result = await service.getInvitations(userId);

      expect(result).toEqual(mockInvitations);
      expect(mockPrisma.invitation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { invitedBy: userId },
          select: expect.objectContaining({
            id: true,
            email: true,
            inviter: expect.any(Object),
          }),
        })
      );
    });

    it('should fetch workspace invitations when authorized (admin)', async () => {
      const mockInvitations = [{ id: 'winv-1', email: 'test@example.com' }];
      const mockWorkspace = {
        id: workspaceId,
        members: [{ role: 'admin' }],
        invitations: mockInvitations,
      };
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);

      const result = await service.getInvitations(userId, workspaceId);

      expect(result).toEqual(mockInvitations);
      expect(mockPrisma.workspace.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: workspaceId },
          select: expect.objectContaining({
            members: {
              where: { userId },
              select: { role: true },
            },
            invitations: expect.any(Object),
          }),
        })
      );
    });

    it('should fetch workspace invitations when authorized (owner)', async () => {
      const mockInvitations = [{ id: 'winv-1', email: 'test@example.com' }];
      const mockWorkspace = {
        id: workspaceId,
        members: [{ role: 'owner' }],
        invitations: mockInvitations,
      };
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);

      const result = await service.getInvitations(userId, workspaceId);

      expect(result).toEqual(mockInvitations);
    });

    it('should throw NotFoundException if workspace does not exist', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(null);

      await expect(service.getInvitations(userId, workspaceId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
        members: [],
        invitations: [],
      });

      await expect(service.getInvitations(userId, workspaceId)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user is only a member (not admin/owner)', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
        members: [{ role: 'member' }],
        invitations: [],
      });

      await expect(service.getInvitations(userId, workspaceId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getInvitationByToken', () => {
    const token = 'test-token';

    it('should return workspace_link if found', async () => {
      const mockInviteLink = {
        id: 'link-1',
        code: token,
        workspace: { id: 'w-1', name: 'W1' },
        createdBy: { id: 'u-1', name: 'User 1' },
      };
      mockPrisma.workspaceInviteLink.findUnique.mockResolvedValue(mockInviteLink);
      mockPrisma.workspaceInvitation.findUnique.mockResolvedValue(null);
      mockPrisma.invitation.findUnique.mockResolvedValue(null);

      const result = await service.getInvitationByToken(token);

      expect(result).toEqual({
        type: 'workspace_link',
        invitation: {
          ...mockInviteLink,
          inviter: mockInviteLink.createdBy,
        },
      });
    });

    it('should return workspace_invitation if found and link is not', async () => {
      const mockWorkspaceInvite = {
        id: 'winv-1',
        token,
        status: 'pending',
        workspace: { id: 'w-1', name: 'W1' },
        inviter: { id: 'u-1', name: 'User 1' },
      };
      mockPrisma.workspaceInviteLink.findUnique.mockResolvedValue(null);
      mockPrisma.workspaceInvitation.findUnique.mockResolvedValue(mockWorkspaceInvite);
      mockPrisma.invitation.findUnique.mockResolvedValue(null);

      const result = await service.getInvitationByToken(token);

      expect(result).toEqual({
        type: 'workspace_invitation',
        invitation: {
          ...mockWorkspaceInvite,
          inviter: mockWorkspaceInvite.inviter,
        },
      });
    });

    it('should throw NotFoundException if none match', async () => {
      mockPrisma.workspaceInviteLink.findUnique.mockResolvedValue(null);
      mockPrisma.workspaceInvitation.findUnique.mockResolvedValue(null);
      mockPrisma.invitation.findUnique.mockResolvedValue(null);

      await expect(service.getInvitationByToken(token)).rejects.toThrow(NotFoundException);
    });
  });
});

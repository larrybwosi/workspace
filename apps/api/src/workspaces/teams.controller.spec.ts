import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { TeamsController } from './teams.controller';
import { TeamSyncService } from './team-sync.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

// Mock @repo/database
vi.mock('@repo/database', () => ({
  prisma: {
    workspace: {
      findUnique: vi.fn(),
    },
    workspaceTeam: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    workspaceTeamMember: {
      create: vi.fn(),
      delete: vi.fn(),
    },
    workspaceAuditLog: {
      create: vi.fn(),
    },
    channel: {
      create: vi.fn(),
    },
  },
}));

// Mock @repo/shared/server
vi.mock('@repo/shared/server', () => ({
  getAblyServer: vi.fn().mockReturnValue(null),
  AblyChannels: {
    workspace: vi.fn((id: string) => `workspace:${id}`),
  },
  EVENTS: {
    WORKSPACE_UPDATED: 'WORKSPACE_UPDATED',
  },
}));

import { prisma } from '@repo/database';

describe('TeamsController', () => {
  let controller: TeamsController;
  let teamSyncService: TeamSyncService;
  const mockPrisma = prisma as any;

  const mockUser: any = { id: 'user-1', email: 'admin@workspace.com', name: 'Admin' };
  const mockWorkspace = {
    id: 'ws-1',
    slug: 'acme',
    members: [{ role: 'admin' }],
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeamsController],
      providers: [
        {
          provide: TeamSyncService,
          useValue: {
            syncTeamMemberToChannel: vi.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get<TeamsController>(TeamsController);
    teamSyncService = module.get<TeamSyncService>(TeamSyncService);
  });

  describe('addMember', () => {
    it('should successfully add a member when team belongs to the workspace', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceTeam.findUnique.mockResolvedValue({ id: 'team-1', workspaceId: 'ws-1' });
      mockPrisma.workspaceTeamMember.create.mockResolvedValue({
        id: 'member-1',
        teamId: 'team-1',
        userId: 'user-2',
        role: 'member',
      });

      const result = await controller.addMember(mockUser, 'acme', 'team-1', { userId: 'user-2' });

      expect(result).toEqual({ id: 'member-1', teamId: 'team-1', userId: 'user-2', role: 'member' });
      expect(mockPrisma.workspaceTeam.findUnique).toHaveBeenCalledWith({
        where: { id: 'team-1' },
        select: { workspaceId: true },
      });
      expect(teamSyncService.syncTeamMemberToChannel).toHaveBeenCalledWith('team-1', 'user-2', 'add');
    });

    it('should throw NotFoundException when team belongs to a different workspace (BOLA / IDOR protection)', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceTeam.findUnique.mockResolvedValue({ id: 'team-other', workspaceId: 'ws-2' });

      await expect(
        controller.addMember(mockUser, 'acme', 'team-other', { userId: 'user-2' })
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.workspaceTeamMember.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when team does not exist', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceTeam.findUnique.mockResolvedValue(null);

      await expect(
        controller.addMember(mockUser, 'acme', 'team-nonexistent', { userId: 'user-2' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not admin/owner', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: 'ws-1',
        slug: 'acme',
        members: [{ role: 'member' }],
      });

      await expect(
        controller.addMember(mockUser, 'acme', 'team-1', { userId: 'user-2' })
      ).rejects.toThrow(ForbiddenException);

      expect(mockPrisma.workspaceTeam.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('removeMember', () => {
    it('should successfully remove a member when team belongs to the workspace', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceTeam.findUnique.mockResolvedValue({ id: 'team-1', workspaceId: 'ws-1' });
      mockPrisma.workspaceTeamMember.delete.mockResolvedValue({});

      const result = await controller.removeMember(mockUser, 'acme', 'team-1', 'user-2');

      expect(result).toEqual({ success: true });
      expect(mockPrisma.workspaceTeamMember.delete).toHaveBeenCalledWith({
        where: {
          teamId_userId: {
            teamId: 'team-1',
            userId: 'user-2',
          },
        },
      });
      expect(teamSyncService.syncTeamMemberToChannel).toHaveBeenCalledWith('team-1', 'user-2', 'remove');
    });

    it('should throw NotFoundException when team belongs to a different workspace (BOLA / IDOR protection)', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceTeam.findUnique.mockResolvedValue({ id: 'team-other', workspaceId: 'ws-2' });

      await expect(
        controller.removeMember(mockUser, 'acme', 'team-other', 'user-2')
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.workspaceTeamMember.delete).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not admin/owner', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: 'ws-1',
        slug: 'acme',
        members: [{ role: 'member' }],
      });

      await expect(
        controller.removeMember(mockUser, 'acme', 'team-1', 'user-2')
      ).rejects.toThrow(ForbiddenException);

      expect(mockPrisma.workspaceTeam.findUnique).not.toHaveBeenCalled();
    });
  });
});

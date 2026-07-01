import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { V2TeamsController } from './teams.controller';
import { ApiV2Guard } from '../../auth/api-v2.guard';
import { V2AuditService } from '../v2-audit.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { prisma } from '@repo/database';

// Mock @repo/database prisma
vi.mock('@repo/database', () => ({
  prisma: {
    workspaceTeam: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
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

describe('V2TeamsController', () => {
  let controller: V2TeamsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [V2TeamsController],
      providers: [
        { provide: V2AuditService, useValue: mockAuditService },
        { provide: 'REDIS_CLIENT', useValue: mockRedis },
      ],
    })
      .overrideGuard(ApiV2Guard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<V2TeamsController>(V2TeamsController);
    vi.clearAllMocks();
  });

  const mockContext = {
    userId: 'user-1',
    workspaceId: 'ws-1',
    workspaceSlug: 'my-workspace',
    scopes: ['*'],
  } as any;

  describe('getTeams', () => {
    it('should return teams from database and cache them', async () => {
      const mockTeams = [{ id: 'team-1', name: 'Engineering' }];
      (prisma.workspaceTeam.findMany as any).mockResolvedValue(mockTeams);

      const result = await controller.getTeams(mockContext);

      expect(prisma.workspaceTeam.findMany).toHaveBeenCalled();
      expect(mockRedis.setex).toHaveBeenCalled();
      expect(result).toEqual({ teams: mockTeams, source: 'database' });
    });

    it('should return teams from cache if available', async () => {
      const mockTeams = [{ id: 'team-1', name: 'Engineering' }];
      mockRedis.get.mockResolvedValue(JSON.stringify(mockTeams));

      const result = await controller.getTeams(mockContext);

      expect(prisma.workspaceTeam.findMany).not.toHaveBeenCalled();
      expect(result).toEqual({ teams: mockTeams, source: 'cache' });
    });
  });

  describe('createTeam', () => {
    it('should create a team and invalidate cache', async () => {
      const teamData = { name: 'Engineering', slug: 'eng' };
      (prisma.workspaceTeam.create as any).mockResolvedValue({ id: 'team-1', ...teamData });

      const result = await controller.createTeam(mockContext, teamData as any);

      expect(prisma.workspaceTeam.create).toHaveBeenCalled();
      expect(mockRedis.del).toHaveBeenCalledWith('v2:teams:ws-1');
      expect(result.team.id).toBe('team-1');
    });

    it('should throw BadRequestException on duplicate slug (P2002)', async () => {
      const error = new Error('Unique constraint failed') as any;
      error.code = 'P2002';
      (prisma.workspaceTeam.create as any).mockRejectedValue(error);

      await expect(
        controller.createTeam(mockContext, { name: 'Eng', slug: 'eng' })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getTeam', () => {
    it('should return a team using findUnique', async () => {
      const mockTeam = { id: 'team-1', workspaceId: 'ws-1', name: 'Engineering' };
      (prisma.workspaceTeam.findUnique as any).mockResolvedValue(mockTeam);

      const result = await controller.getTeam(mockContext, 'team-1');

      expect(prisma.workspaceTeam.findUnique).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'team-1' }
      }));
      expect(result).toEqual({ team: mockTeam });
    });

    it('should throw NotFoundException if team belongs to another workspace', async () => {
      const mockTeam = { id: 'team-1', workspaceId: 'other-ws', name: 'Engineering' };
      (prisma.workspaceTeam.findUnique as any).mockResolvedValue(mockTeam);

      await expect(controller.getTeam(mockContext, 'team-1')).rejects.toThrow(NotFoundException);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { V10EnterpriseService } from './enterprise.service';
import { prisma } from '@repo/database';
import { publishRealtime } from '@repo/shared/server';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@repo/database', () => ({
  prisma: {
    workspaceDepartment: {
      findUnique: vi.fn(),
    },
    departmentAnnouncement: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@repo/shared/server', () => ({
  publishRealtime: vi.fn().mockReturnValue({ catch: vi.fn() }),
  AblyChannels: {
    workspace: (id: string) => `workspace-${id}`,
  },
}));

describe('V10EnterpriseService', () => {
  let service: V10EnterpriseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [V10EnterpriseService],
    }).compile();

    service = module.get<V10EnterpriseService>(V10EnterpriseService);
    vi.clearAllMocks();
    (publishRealtime as any).mockReturnValue({ catch: vi.fn() });
  });

  describe('createAnnouncement', () => {
    const bot = { id: 'bot1' };
    const departmentId = 'dept1';
    const validData = {
      title: 'Company Meeting',
      content: 'All hands at 3 PM',
      priority: 'high',
    };

    it('should throw BadRequestException if title or content is missing', async () => {
      await expect(service.createAnnouncement(bot, departmentId, { title: '' })).rejects.toThrow(BadRequestException);
      await expect(service.createAnnouncement(bot, departmentId, { content: '' })).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if department does not exist', async () => {
      (prisma.workspaceDepartment.findUnique as any).mockResolvedValue(null);

      await expect(service.createAnnouncement(bot, departmentId, validData)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if bot is not a member of the workspace', async () => {
      (prisma.workspaceDepartment.findUnique as any).mockResolvedValue({
        id: departmentId,
        workspaceId: 'ws1',
        workspace: {
          members: [],
        },
      });

      await expect(service.createAnnouncement(bot, departmentId, validData)).rejects.toThrow(ForbiddenException);
    });

    it('should create announcement with select optimization and background publishRealtime', async () => {
      const mockDepartment = {
        id: departmentId,
        workspaceId: 'ws1',
        workspace: {
          members: [{ userId: 'bot1' }],
        },
      };

      const mockAnnouncement = {
        id: 'ann1',
        departmentId,
        authorId: 'bot1',
        title: 'Company Meeting',
        content: 'All hands at 3 PM',
        priority: 'high',
      };

      (prisma.workspaceDepartment.findUnique as any).mockResolvedValue(mockDepartment);
      (prisma.departmentAnnouncement.create as any).mockResolvedValue(mockAnnouncement);

      const result = await service.createAnnouncement(bot, departmentId, validData);

      expect(prisma.workspaceDepartment.findUnique).toHaveBeenCalledWith({
        where: { id: departmentId },
        select: {
          id: true,
          workspaceId: true,
          workspace: {
            select: {
              members: {
                where: { userId: bot.id },
                select: { userId: true },
              },
            },
          },
        },
      });

      expect(prisma.departmentAnnouncement.create).toHaveBeenCalledWith({
        data: {
          departmentId,
          authorId: bot.id,
          title: 'Company Meeting',
          content: 'All hands at 3 PM',
          priority: 'high',
          targetAudience: { departments: [departmentId] },
        },
      });

      expect(publishRealtime).toHaveBeenCalledWith('workspace-ws1', 'DEPARTMENT_ANNOUNCEMENT_CREATE', {
        announcement: mockAnnouncement,
      });

      expect(result).toEqual(mockAnnouncement);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { V2AnnouncementsController } from './announcements.controller';
import { prisma } from '@repo/database';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { V2AuditService } from '../v2-audit.service';
import { ConfigService } from '@nestjs/config';

vi.mock('@repo/database', () => ({
  prisma: {
    departmentAnnouncement: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    workspaceDepartment: {
      update: vi.fn(),
    },
  },
}));

describe('V2AnnouncementsController', () => {
  let controller: V2AnnouncementsController;
  let redisMock: any;

  beforeEach(async () => {
    redisMock = {
      get: vi.fn(),
      setex: vi.fn(),
      del: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [V2AnnouncementsController],
      providers: [
        { provide: 'REDIS_CLIENT', useValue: redisMock },
        { provide: V2AuditService, useValue: { log: vi.fn().mockResolvedValue(undefined) } },
        { provide: ConfigService, useValue: { get: vi.fn() } },
      ],
    }).compile();

    controller = module.get<V2AnnouncementsController>(V2AnnouncementsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAnnouncements', () => {
    it('should return cached announcements if available', async () => {
      const context: any = { workspaceId: 'ws-1', scopes: ['*'] };
      const cachedData = JSON.stringify([{ id: '1', title: 'Cached' }]);
      redisMock.get.mockResolvedValue(cachedData);

      const result = await controller.getAnnouncements(context);

      expect(redisMock.get).toHaveBeenCalledWith('v2:announcements:ws-1');
      expect(result).toEqual({ announcements: JSON.parse(cachedData), source: 'cache' });
      expect(prisma.departmentAnnouncement.findMany).not.toHaveBeenCalled();
    });

    it('should fetch and cache announcements if not in cache', async () => {
      const context: any = { workspaceId: 'ws-1', scopes: ['*'] };
      const dbData = [{ id: '1', title: 'DB' }];
      redisMock.get.mockResolvedValue(null);
      (prisma.departmentAnnouncement.findMany as any).mockResolvedValue(dbData);

      const result = await controller.getAnnouncements(context);

      expect(prisma.departmentAnnouncement.findMany).toHaveBeenCalled();
      expect(redisMock.setex).toHaveBeenCalledWith('v2:announcements:ws-1', 600, JSON.stringify(dbData));
      expect(result).toEqual({ announcements: dbData, source: 'database' });
    });
  });

  describe('getAnnouncement', () => {
    it('should return announcement if found and belongs to context workspace', async () => {
      const context: any = { workspaceId: 'ws-1', scopes: ['*'] };
      const mockAnnouncement = {
        id: 'ann-1',
        title: 'Mock Title',
        department: { workspaceId: 'ws-1' },
      };
      (prisma.departmentAnnouncement.findUnique as any).mockResolvedValue(mockAnnouncement);

      const result = await controller.getAnnouncement(context, 'ann-1');

      expect(prisma.departmentAnnouncement.findUnique).toHaveBeenCalledWith({
        where: { id: 'ann-1' },
        select: expect.any(Object),
      });
      expect(result).toEqual({ announcement: mockAnnouncement });
    });

    it('should throw NotFoundException if announcement is not found', async () => {
      const context: any = { workspaceId: 'ws-1', scopes: ['*'] };
      (prisma.departmentAnnouncement.findUnique as any).mockResolvedValue(null);

      await expect(controller.getAnnouncement(context, 'ann-1')).rejects.toThrow(
        'Announcement not found'
      );
    });

    it('should throw NotFoundException if announcement belongs to another workspace', async () => {
      const context: any = { workspaceId: 'ws-1', scopes: ['*'] };
      const mockAnnouncement = {
        id: 'ann-1',
        title: 'Mock Title',
        department: { workspaceId: 'ws-different' },
      };
      (prisma.departmentAnnouncement.findUnique as any).mockResolvedValue(mockAnnouncement);

      await expect(controller.getAnnouncement(context, 'ann-1')).rejects.toThrow(
        'Announcement not found'
      );
    });
  });
});

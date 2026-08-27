import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuditLogsController } from './audit-logs.controller';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { prisma } from '@repo/database';
import type { User } from '@repo/database';

vi.mock('@repo/database', () => ({
  prisma: {
    workspace: {
      findUnique: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
  },
}));

describe('AuditLogsController', () => {
  let controller: AuditLogsController;
  const mockUser: User = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    username: 'testuser',
    avatar: null,
    image: null,
    status: 'online',
    customStatus: null,
    bio: null,
    isBot: false,
    botToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new AuditLogsController();
  });

  describe('exportAuditLogs', () => {
    it('should throw NotFoundException if workspace does not exist', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue(null);
      const mockRes = { header: vi.fn(), send: vi.fn() } as any;

      await expect(
        controller.exportAuditLogs(mockUser, 'non-existent', mockRes)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not admin or owner', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue({
        id: 'ws-1',
        members: [{ role: 'member' }],
        auditLogs: [],
      });
      const mockRes = { header: vi.fn(), send: vi.fn() } as any;

      await expect(
        controller.exportAuditLogs(mockUser, 'workspace-1', mockRes)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should export CSV using pre-fetched user relation without calling user.findMany', async () => {
      const mockAuditLogs = [
        {
          id: 'log-1',
          action: 'member.add',
          resource: 'member',
          resourceId: 'mem-2',
          metadata: {},
          createdAt: new Date('2026-08-27T00:00:00.000Z'),
          user: {
            id: 'user-2',
            name: 'Other User',
            email: 'other@example.com',
          },
        },
      ];

      (prisma.workspace.findUnique as any).mockResolvedValue({
        id: 'ws-1',
        members: [{ role: 'admin' }],
        auditLogs: mockAuditLogs,
      });

      const mockRes = { header: vi.fn(), send: vi.fn() } as any;

      await controller.exportAuditLogs(mockUser, 'workspace-1', mockRes);

      expect(prisma.workspace.findUnique).toHaveBeenCalledWith({
        where: { slug: 'workspace-1' },
        select: expect.objectContaining({
          id: true,
          members: {
            where: { userId: 'user-1' },
            select: { role: true },
          },
          auditLogs: expect.objectContaining({
            take: 10000,
            orderBy: { createdAt: 'desc' },
            select: expect.objectContaining({
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            }),
          }),
        }),
      });

      expect(prisma.user.findMany).not.toHaveBeenCalled();
      expect(mockRes.header).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockRes.send).toHaveBeenCalledWith(expect.stringContaining('Other User'));
    });
  });

  describe('getAuditLogs', () => {
    it('should throw NotFoundException if workspace does not exist', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue(null);

      await expect(
        controller.getAuditLogs(mockUser, 'non-existent', '1', '50')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not a member of the workspace', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue({
        id: 'ws-1',
        name: 'Workspace 1',
        slug: 'workspace-1',
        members: [],
        auditLogs: [],
        _count: { auditLogs: 0 },
      });

      await expect(
        controller.getAuditLogs(mockUser, 'workspace-1', '1', '50')
      ).rejects.toThrow(ForbiddenException);
    });

    it('should fetch audit logs and enrich with user data in single consolidated query', async () => {
      const mockAuditLogs = [
        {
          id: 'log-1',
          workspaceId: 'ws-1',
          userId: 'user-2',
          action: 'member.add',
          resource: 'member',
          resourceId: 'mem-2',
          metadata: {},
          createdAt: new Date(),
          user: {
            id: 'user-2',
            name: 'Other User',
            email: 'other@example.com',
            image: 'avatar.png',
          },
        },
      ];

      (prisma.workspace.findUnique as any).mockResolvedValue({
        id: 'ws-1',
        name: 'Workspace 1',
        slug: 'workspace-1',
        members: [{ role: 'member' }],
        auditLogs: mockAuditLogs,
        _count: { auditLogs: 1 },
      });

      (prisma.user.findMany as any).mockResolvedValue([
        {
          id: 'user-2',
          name: 'Other User',
          email: 'other@example.com',
          image: 'avatar.png',
        },
      ]);

      const result = await controller.getAuditLogs(mockUser, 'workspace-1', '1', '50');

      expect(prisma.workspace.findUnique).toHaveBeenCalledWith({
        where: { slug: 'workspace-1' },
        select: expect.objectContaining({
          id: true,
          name: true,
          slug: true,
          members: {
            where: { userId: 'user-1' },
            select: { role: true },
          },
          auditLogs: {
            skip: 0,
            take: 50,
            orderBy: { createdAt: 'desc' },
            select: expect.objectContaining({
              id: true,
              action: true,
              resource: true,
              resourceId: true,
              metadata: true,
              createdAt: true,
              user: {
                select: expect.objectContaining({
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                }),
              },
            }),
          },
          _count: {
            select: { auditLogs: true },
          },
        }),
      });

      // Verifies that secondary prisma.user.findMany is NOT called because user relation is pre-fetched
      expect(prisma.user.findMany).not.toHaveBeenCalled();

      expect(result.logs[0].user).toEqual({
        id: 'user-2',
        name: 'Other User',
        email: 'other@example.com',
        image: 'avatar.png',
      });
      expect(result.total).toBe(1);
    });
  });
});

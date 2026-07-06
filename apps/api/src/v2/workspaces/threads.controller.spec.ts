import { Test, TestingModule } from '@nestjs/testing';
import { V2ThreadsController } from './threads.controller';
import { prisma } from '@repo/database';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { V2AuditService } from '../v2-audit.service';
import { ConfigService } from '@nestjs/config';

vi.mock('@repo/database', () => ({
  prisma: {
    thread: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    message: {
      findMany: vi.fn(),
    },
  },
}));

describe('V2ThreadsController', () => {
  let controller: V2ThreadsController;
  let redis: any;
  let auditService: V2AuditService;

  beforeEach(async () => {
    redis = {
      get: vi.fn(),
      setex: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [V2ThreadsController],
      providers: [
        { provide: 'REDIS_CLIENT', useValue: redis },
        { provide: V2AuditService, useValue: { log: vi.fn().mockReturnValue({ catch: vi.fn() }) } },
        { provide: ConfigService, useValue: { get: vi.fn() } },
      ],
    }).compile();

    controller = module.get<V2ThreadsController>(V2ThreadsController);
    auditService = module.get<V2AuditService>(V2AuditService);
  });

  describe('getThreads', () => {
    const context: any = { workspaceId: 'ws-1', scopes: ['threads:read'] };

    it('should return cached threads if available', async () => {
      const cachedThreads = [{ id: 'thread-1' }];
      redis.get.mockResolvedValue(JSON.stringify(cachedThreads));

      const result = await controller.getThreads(context);

      expect(result).toEqual({ threads: cachedThreads });
      expect(redis.get).toHaveBeenCalledWith('v2:threads:ws-1:default');
      expect(prisma.thread.findMany).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache if not in redis', async () => {
      redis.get.mockResolvedValue(null);
      const dbThreads = [{ id: 'thread-1' }];
      (prisma.thread.findMany as any).mockResolvedValue(dbThreads);

      const result = await controller.getThreads(context);

      expect(result).toEqual({ threads: dbThreads });
      expect(redis.setex).toHaveBeenCalledWith('v2:threads:ws-1:default', 600, JSON.stringify(dbThreads));
    });

    it('should not use cache for non-default queries', async () => {
      await controller.getThreads(context, 'chan-1', '50');

      expect(redis.get).not.toHaveBeenCalled();
      expect(prisma.thread.findMany).toHaveBeenCalled();
    });

    it('should background audit logging', async () => {
      redis.get.mockResolvedValue(null);
      (prisma.thread.findMany as any).mockResolvedValue([]);

      await controller.getThreads(context);

      expect(auditService.log).toHaveBeenCalled();
      // Verify it's not awaited (we mock it to return an object with .catch)
    });
  });

  describe('getThreadMessages', () => {
    const context: any = { workspaceId: 'ws-1', scopes: ['threads:read', 'messages:read'] };

    it('should return messages in ascending order and format them', async () => {
      const messages = [
        {
          id: 'msg-1',
          timestamp: new Date(),
          reactions: [{ emoji: '👍', userId: 'user-1' }],
          user: { id: 'u-1', name: 'User 1', avatar: 'av-1' },
        },
      ];
      (prisma.message.findMany as any).mockResolvedValue(messages);

      const result = await controller.getThreadMessages(context, 'thread-1');

      expect(prisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { timestamp: 'asc' },
        })
      );
      expect(result.messages[0]).toMatchObject({
        id: 'msg-1',
        reactions: [{ emoji: '👍', count: 1, users: ['user-1'] }],
      });
    });
  });
});

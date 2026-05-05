import { Test, TestingModule } from '@nestjs/testing';
import { V10GuildsService } from './guilds.service';
import { prisma } from '@repo/database';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@repo/database', () => ({
  prisma: {
    channel: {
      findMany: vi.fn(),
    },
    workspaceMember: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    workspace: {
      findUnique: vi.fn(),
    },
  },
}));

describe('V10GuildsService', () => {
  let service: V10GuildsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [V10GuildsService],
    }).compile();

    service = module.get<V10GuildsService>(V10GuildsService);
    vi.clearAllMocks();
  });

  describe('getChannels', () => {
    it('should fetch channels with select optimization', async () => {
      const mockChannels = [
        { id: '1', type: 'channel', workspaceId: 'guild1', name: 'general', description: 'desc', parentId: null },
      ];
      (prisma.channel.findMany as any).mockResolvedValue(mockChannels);

      const result = await service.getChannels({}, 'guild1');

      expect(prisma.channel.findMany).toHaveBeenCalledWith({
        where: { workspaceId: 'guild1' },
        select: {
          id: true,
          type: true,
          workspaceId: true,
          name: true,
          description: true,
          parentId: true,
        },
      });
      expect(result[0].name).toBe('general');
    });
  });

  describe('getMembers', () => {
    it('should fetch members with select optimization', async () => {
      const mockMembers = [
        {
          joinedAt: new Date(),
          role: 'member',
          user: { id: 'u1', name: 'user1', avatar: 'av1', isBot: false },
        },
      ];
      (prisma.workspaceMember.findMany as any).mockResolvedValue(mockMembers);

      const result = await service.getMembers({}, 'guild1', { limit: 10 });

      expect(prisma.workspaceMember.findMany).toHaveBeenCalledWith({
        where: { workspaceId: 'guild1' },
        take: 10,
        select: {
          joinedAt: true,
          role: true,
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              isBot: true,
            },
          },
        },
      });
      expect(result[0].user.username).toBe('user1');
    });
  });

  describe('getGuild', () => {
    const bot = { id: 'bot1', botApplication: { id: 'app1' } };
    const guildId = 'guild1';

    it('should fetch guild with select and count optimizations', async () => {
      const mockWorkspace = {
        id: guildId,
        name: 'Guild 1',
        icon: 'icon1',
        ownerId: 'owner1',
        slug: 'guild-1',
        description: 'desc1',
        members: [{ userId: 'bot1' }],
        _count: { members: 100 },
      };
      (prisma.workspace.findUnique as any).mockResolvedValue(mockWorkspace);
      (prisma.workspaceMember.count as any).mockResolvedValue(10);

      const result = await service.getGuild(bot, guildId);

      expect(prisma.workspace.findUnique).toHaveBeenCalledWith({
        where: { id: guildId },
        select: {
          id: true,
          name: true,
          icon: true,
          ownerId: true,
          slug: true,
          description: true,
          members: {
            where: { userId: bot.id },
            select: { userId: true },
          },
          _count: {
            select: { members: true },
          },
        },
      });
      expect(prisma.workspaceMember.count).toHaveBeenCalledWith({
        where: {
          workspaceId: guildId,
          user: { status: 'online' },
        },
      });
      expect(result.approximate_member_count).toBe(100);
      expect(result.approximate_presence_count).toBe(10);
    });

    it('should throw NotFoundException if workspace not found', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue(null);
      await expect(service.getGuild(bot, guildId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if bot is not a member', async () => {
      const mockWorkspace = {
        id: guildId,
        members: [],
      };
      (prisma.workspace.findUnique as any).mockResolvedValue(mockWorkspace);
      await expect(service.getGuild(bot, guildId)).rejects.toThrow(ForbiddenException);
    });
  });
});

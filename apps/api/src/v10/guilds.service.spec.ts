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
      update: vi.fn(),
      count: vi.fn(),
    },
    workspace: {
      findUnique: vi.fn(),
    },
    workspaceAuditLog: {
      create: vi.fn(),
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
    const bot = { id: 'bot1' };

    it('should fetch channels with select optimization if bot is a member', async () => {
      const mockChannels = [
        { id: '1', type: 'channel', workspaceId: 'guild1', name: 'general', description: 'desc', parentId: null },
      ];
      (prisma.workspaceMember.findUnique as any).mockResolvedValue({ id: 'wm_bot' });
      (prisma.channel.findMany as any).mockResolvedValue(mockChannels);

      const result = await service.getChannels(bot, 'guild1');

      expect(prisma.workspaceMember.findUnique).toHaveBeenCalledWith({
        where: { workspaceId_userId: { workspaceId: 'guild1', userId: 'bot1' } },
      });
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

    it('should throw ForbiddenException if bot is not a member', async () => {
      (prisma.workspaceMember.findUnique as any).mockResolvedValue(null);
      await expect(service.getChannels(bot, 'guild1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getMembers', () => {
    const bot = { id: 'bot1' };

    it('should fetch members with select optimization if bot is a member', async () => {
      const mockMembers = [
        {
          id: 'wm1',
          joinedAt: new Date(),
          role: 'member',
          user: { id: 'u1', name: 'user1', avatar: 'av1', isBot: false },
        },
      ];
      (prisma.workspaceMember.findUnique as any).mockResolvedValue({ id: 'wm_bot' });
      (prisma.workspaceMember.findMany as any).mockResolvedValue(mockMembers);

      const result = await service.getMembers(bot, 'guild1', { limit: 10 });

      expect(prisma.workspaceMember.findUnique).toHaveBeenCalledWith({
        where: { workspaceId_userId: { workspaceId: 'guild1', userId: 'bot1' } },
      });
      expect(prisma.workspaceMember.findMany).toHaveBeenCalledWith({
        where: { workspaceId: 'guild1' },
        take: 10,
        select: {
          id: true,
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

    it('should throw ForbiddenException if bot is not a member', async () => {
      (prisma.workspaceMember.findUnique as any).mockResolvedValue(null);
      await expect(service.getMembers(bot, 'guild1', { limit: 10 })).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getRoles', () => {
    const bot = { id: 'bot1' };

    it('should return roles if bot is a member', async () => {
      (prisma.workspaceMember.findUnique as any).mockResolvedValue({ id: 'wm_bot' });

      const roles = await service.getRoles(bot, 'guild1');

      expect(prisma.workspaceMember.findUnique).toHaveBeenCalledWith({
        where: { workspaceId_userId: { workspaceId: 'guild1', userId: 'bot1' } },
      });
      expect(roles.length).toBeGreaterThan(0);
    });

    it('should throw ForbiddenException if bot is not a member', async () => {
      (prisma.workspaceMember.findUnique as any).mockResolvedValue(null);
      await expect(service.getRoles(bot, 'guild1')).rejects.toThrow(ForbiddenException);
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

  describe('addMemberRole', () => {
    const bot = { id: 'bot1' };
    const guildId = 'guild1';
    const userId = 'user1';

    it('should add member role and create audit log when bot has MANAGE_ROLES permission', async () => {
      // MANAGE_ROLES permission bit: 1 << 28 = 268435456
      (prisma.workspaceMember.findUnique as any)
        .mockResolvedValueOnce({ id: 'wm_bot', permissions: BigInt(268435456) }) // botMember
        .mockResolvedValueOnce({ id: 'wm_user', role: 'member', permissions: BigInt(0) }); // targetMember

      (prisma.workspaceMember.update as any).mockResolvedValue({});
      (prisma.workspaceAuditLog.create as any).mockResolvedValue({});

      await service.addMemberRole(bot, guildId, userId, '100000000000000002'); // admin role

      expect(prisma.workspaceMember.update).toHaveBeenCalledWith({
        where: { id: 'wm_user' },
        data: { role: 'admin', permissions: BigInt(8) },
      });
      expect(prisma.workspaceAuditLog.create).toHaveBeenCalledWith({
        data: {
          workspaceId: guildId,
          userId: bot.id,
          action: 'BOT_MEMBER_ROLE_ADD',
          resource: 'member',
          resourceId: userId,
          metadata: { roleId: '100000000000000002' },
        },
      });
    });

    it('should throw ForbiddenException if bot is not a member', async () => {
      (prisma.workspaceMember.findUnique as any).mockResolvedValueOnce(null);
      await expect(service.addMemberRole(bot, guildId, userId, 'admin')).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if bot lacks MANAGE_ROLES permission', async () => {
      (prisma.workspaceMember.findUnique as any).mockResolvedValueOnce({ id: 'wm_bot', permissions: BigInt(0) });
      await expect(service.addMemberRole(bot, guildId, userId, 'admin')).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if target member is not found', async () => {
      (prisma.workspaceMember.findUnique as any)
        .mockResolvedValueOnce({ id: 'wm_bot', permissions: BigInt(268435456) })
        .mockResolvedValueOnce(null);

      await expect(service.addMemberRole(bot, guildId, userId, 'admin')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if target member is owner', async () => {
      (prisma.workspaceMember.findUnique as any)
        .mockResolvedValueOnce({ id: 'wm_bot', permissions: BigInt(268435456) })
        .mockResolvedValueOnce({ id: 'wm_user', role: 'owner' });

      await expect(service.addMemberRole(bot, guildId, userId, 'admin')).rejects.toThrow('Forbidden: Cannot modify owner role');
    });

    it('should throw ForbiddenException if attempting to assign owner role', async () => {
      (prisma.workspaceMember.findUnique as any)
        .mockResolvedValueOnce({ id: 'wm_bot', permissions: BigInt(268435456) })
        .mockResolvedValueOnce({ id: 'wm_user', role: 'member' });

      await expect(service.addMemberRole(bot, guildId, userId, '100000000000000001')).rejects.toThrow(
        'Forbidden: Cannot assign owner role'
      );
    });
  });

  describe('removeMemberRole', () => {
    const bot = { id: 'bot1' };
    const guildId = 'guild1';
    const userId = 'user1';

    it('should remove member role and create audit log when bot has MANAGE_ROLES permission', async () => {
      (prisma.workspaceMember.findUnique as any)
        .mockResolvedValueOnce({ id: 'wm_bot', permissions: BigInt(268435456) }) // botMember
        .mockResolvedValueOnce({ id: 'wm_user', role: 'admin' }); // targetMember

      (prisma.workspaceMember.update as any).mockResolvedValue({});
      (prisma.workspaceAuditLog.create as any).mockResolvedValue({});

      await service.removeMemberRole(bot, guildId, userId, '100000000000000002');

      expect(prisma.workspaceMember.update).toHaveBeenCalledWith({
        where: { id: 'wm_user' },
        data: { role: 'member' },
      });
      expect(prisma.workspaceAuditLog.create).toHaveBeenCalledWith({
        data: {
          workspaceId: guildId,
          userId: bot.id,
          action: 'BOT_MEMBER_ROLE_REMOVE',
          resource: 'member',
          resourceId: userId,
          metadata: { roleId: '100000000000000002' },
        },
      });
    });

    it('should throw ForbiddenException if bot is not a member', async () => {
      (prisma.workspaceMember.findUnique as any).mockResolvedValueOnce(null);
      await expect(service.removeMemberRole(bot, guildId, userId, 'admin')).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if bot lacks MANAGE_ROLES permission', async () => {
      (prisma.workspaceMember.findUnique as any).mockResolvedValueOnce({ id: 'wm_bot', permissions: BigInt(0) });
      await expect(service.removeMemberRole(bot, guildId, userId, 'admin')).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if target member is not found', async () => {
      (prisma.workspaceMember.findUnique as any)
        .mockResolvedValueOnce({ id: 'wm_bot', permissions: BigInt(268435456) })
        .mockResolvedValueOnce(null);

      await expect(service.removeMemberRole(bot, guildId, userId, 'admin')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if target member is owner', async () => {
      (prisma.workspaceMember.findUnique as any)
        .mockResolvedValueOnce({ id: 'wm_bot', permissions: BigInt(268435456) })
        .mockResolvedValueOnce({ id: 'wm_user', role: 'owner' });

      await expect(service.removeMemberRole(bot, guildId, userId, 'admin')).rejects.toThrow('Forbidden: Cannot modify owner role');
    });
  });
});

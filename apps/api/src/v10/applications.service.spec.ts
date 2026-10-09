import { describe, it, expect, vi, beforeEach } from 'vitest';
import { V10ApplicationsService } from './applications.service';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { prisma } from '@repo/database';

vi.mock('@repo/database', () => ({
  prisma: {
    botCommand: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    workspaceMember: {
      findUnique: vi.fn(),
    },
  },
}));

describe('V10ApplicationsService', () => {
  let service: V10ApplicationsService;

  const mockBot = {
    id: 'bot_123',
    name: 'Test Bot',
    botApplication: {
      id: 'app_123',
    },
  };

  beforeEach(() => {
    service = new V10ApplicationsService();
    vi.clearAllMocks();
  });

  describe('getCommands', () => {
    it('should throw ForbiddenException if bot application ID does not match', async () => {
      await expect(service.getCommands(mockBot, 'app_other')).rejects.toThrow(ForbiddenException);
    });

    it('should return global commands for matching application ID', async () => {
      const mockCommands = [
        {
          id: 'cmd_1',
          applicationId: 'app_123',
          name: 'ping',
          description: 'Ping command',
          options: [],
          type: 1,
        },
      ];

      (prisma.botCommand.findMany as any).mockResolvedValue(mockCommands);

      const result = await service.getCommands(mockBot, 'app_123');

      expect(prisma.botCommand.findMany).toHaveBeenCalledWith({
        where: { applicationId: 'app_123', guildId: null },
      });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('ping');
    });
  });

  describe('createCommand', () => {
    it('should throw ForbiddenException if bot application ID mismatches', async () => {
      await expect(
        service.createCommand(mockBot, 'app_other', { name: 'ping', description: 'pong' })
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if name or description is missing', async () => {
      await expect(service.createCommand(mockBot, 'app_123', { name: 'ping' })).rejects.toThrow(
        BadRequestException
      );
    });

    it('should create global command successfully', async () => {
      const mockCreatedCommand = {
        id: 'cmd_1',
        applicationId: 'app_123',
        name: 'ping',
        description: 'Ping command',
        options: [],
        type: 1,
      };

      (prisma.botCommand.upsert as any).mockResolvedValue(mockCreatedCommand);

      const result = await service.createCommand(mockBot, 'app_123', {
        name: 'ping',
        description: 'Ping command',
      });

      expect(result.name).toBe('ping');
      expect(result.application_id).toBe('app_123');
    });
  });

  describe('getGuildCommands', () => {
    it('should throw ForbiddenException if application ID mismatches', async () => {
      await expect(service.getGuildCommands(mockBot, 'app_other', 'guild_1')).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should throw ForbiddenException if bot is not a member of the guild', async () => {
      (prisma.workspaceMember.findUnique as any).mockResolvedValue(null);

      await expect(service.getGuildCommands(mockBot, 'app_123', 'guild_1')).rejects.toThrow(
        'Bot is not a member of this guild'
      );
      expect(prisma.workspaceMember.findUnique).toHaveBeenCalledWith({
        where: { workspaceId_userId: { workspaceId: 'guild_1', userId: 'bot_123' } },
      });
    });

    it('should return guild commands when bot is a member of the workspace', async () => {
      (prisma.workspaceMember.findUnique as any).mockResolvedValue({
        id: 'member_1',
        workspaceId: 'guild_1',
        userId: 'bot_123',
      });

      const mockCommands = [
        {
          id: 'cmd_guild_1',
          applicationId: 'app_123',
          name: 'guildping',
          description: 'Guild Ping',
          options: [],
          guildId: 'guild_1',
          type: 1,
        },
      ];

      (prisma.botCommand.findMany as any).mockResolvedValue(mockCommands);

      const result = await service.getGuildCommands(mockBot, 'app_123', 'guild_1');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('guildping');
      expect(result[0].guild_id).toBe('guild_1');
    });
  });

  describe('createGuildCommand', () => {
    it('should throw ForbiddenException if application ID mismatches', async () => {
      await expect(
        service.createGuildCommand(mockBot, 'app_other', 'guild_1', {
          name: 'ping',
          description: 'pong',
        })
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if bot is not a member of the guild', async () => {
      (prisma.workspaceMember.findUnique as any).mockResolvedValue(null);

      await expect(
        service.createGuildCommand(mockBot, 'app_123', 'guild_1', {
          name: 'ping',
          description: 'pong',
        })
      ).rejects.toThrow('Bot is not a member of this guild');
    });

    it('should throw BadRequestException if name or description is missing', async () => {
      (prisma.workspaceMember.findUnique as any).mockResolvedValue({
        id: 'member_1',
        workspaceId: 'guild_1',
        userId: 'bot_123',
      });

      await expect(
        service.createGuildCommand(mockBot, 'app_123', 'guild_1', { name: 'ping' })
      ).rejects.toThrow(BadRequestException);
    });

    it('should create guild command successfully when bot is a member of the workspace', async () => {
      (prisma.workspaceMember.findUnique as any).mockResolvedValue({
        id: 'member_1',
        workspaceId: 'guild_1',
        userId: 'bot_123',
      });

      const mockCreatedGuildCommand = {
        id: 'cmd_guild_1',
        applicationId: 'app_123',
        name: 'guildping',
        description: 'Guild Ping',
        options: [],
        guildId: 'guild_1',
        type: 1,
      };

      (prisma.botCommand.upsert as any).mockResolvedValue(mockCreatedGuildCommand);

      const result = await service.createGuildCommand(mockBot, 'app_123', 'guild_1', {
        name: 'guildping',
        description: 'Guild Ping',
      });

      expect(result.name).toBe('guildping');
      expect(result.guild_id).toBe('guild_1');
    });
  });
});

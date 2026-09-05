import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { V3ApplicationsController } from './v3-applications.controller';
import { ApiV3Guard, ApiV3Context } from '../auth/api-v3.guard';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { prisma } from '@repo/database';

vi.mock('@repo/database', () => ({
  User: class {},
  prisma: {
    botApplication: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    workspace: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    workspaceMember: {
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
    workspaceTeam: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    channel: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    channelMember: {
      upsert: vi.fn(),
      createMany: vi.fn(),
    },
  },
}));

describe('V3ApplicationsController', () => {
  let controller: V3ApplicationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [V3ApplicationsController],
    })
      .overrideGuard(ApiV3Guard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<V3ApplicationsController>(V3ApplicationsController);
    vi.clearAllMocks();
  });

  const mockContext: ApiV3Context = { userId: 'user-1', clientId: 'session:user-1', scopes: ['*'] };

  describe('listApplications', () => {
    it('should return list of bot applications owned by the user', async () => {
      const mockApps = [
        {
          id: 'app-1',
          name: 'Bot One',
          description: 'Desc 1',
          clientId: 'client-1',
          clientSecret: 'secret-1',
          ownerId: 'user-1',
          bot: { id: 'bot-1', name: 'Bot One', avatar: null, botToken: 'token-1', status: 'online' },
          createdAt: new Date(),
        },
      ];

      (prisma.botApplication.findMany as any).mockResolvedValue(mockApps);

      const result = await controller.listApplications(mockContext);

      expect(prisma.botApplication.findMany).toHaveBeenCalledWith({
        where: { ownerId: 'user-1' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Bot One');
      expect(result[0].bot?.botToken).toBe('token-1');
    });
  });

  describe('createApplication', () => {
    it('should create bot user and bot application', async () => {
      const mockBotUser = {
        id: 'bot_123',
        name: 'Helper Bot',
        email: 'bot-bot_123@system.internal',
        isBot: true,
        botToken: 'bot_123.123456.sig',
        status: 'online',
      };

      const mockApp = {
        id: 'app-123',
        name: 'Helper Bot',
        description: 'Assists with tasks',
        clientId: 'app_123',
        clientSecret: 'sec_123',
        ownerId: 'user-1',
        botId: 'bot_123',
        workspaceId: null,
        interactionsUrl: null,
        channelDefinitions: null,
        createdAt: new Date(),
        bot: mockBotUser,
      };

      (prisma.user.create as any).mockResolvedValue(mockBotUser);
      (prisma.botApplication.create as any).mockResolvedValue(mockApp);

      const result = await controller.createApplication(mockContext, {
        name: 'Helper Bot',
        description: 'Assists with tasks',
      });

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Helper Bot',
          isBot: true,
        }),
      });
      expect(prisma.botApplication.create).toHaveBeenCalled();
      expect(result.id).toBe('app-123');
      expect(result.bot.botToken).toBeDefined();
    });

    it('should throw BadRequestException if name is missing', async () => {
      await expect(controller.createApplication(mockContext, { name: '' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('getApplication', () => {
    it('should return application details if owned by user', async () => {
      const mockApp = {
        id: 'app-1',
        name: 'My App',
        ownerId: 'user-1',
        bot: { id: 'bot-1', name: 'My App', botToken: 'token-1' },
      };

      (prisma.botApplication.findUnique as any).mockResolvedValue(mockApp);

      const result = await controller.getApplication(mockContext, 'app-1');
      expect(result.name).toBe('My App');
    });

    it('should throw NotFoundException if app does not exist', async () => {
      (prisma.botApplication.findUnique as any).mockResolvedValue(null);
      await expect(controller.getApplication(mockContext, 'missing')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if app owned by another user', async () => {
      const mockApp = { id: 'app-1', ownerId: 'other-user' };
      (prisma.botApplication.findUnique as any).mockResolvedValue(mockApp);
      await expect(controller.getApplication(mockContext, 'app-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('resetToken', () => {
    it('should regenerate botToken for the bot user', async () => {
      const mockApp = {
        id: 'app-1',
        ownerId: 'user-1',
        botId: 'bot-1',
      };

      (prisma.botApplication.findUnique as any).mockResolvedValue(mockApp);
      (prisma.user.update as any).mockResolvedValue({
        id: 'bot-1',
        name: 'Bot 1',
        botToken: 'new_token_123',
      });

      const result = await controller.resetToken(mockContext, 'app-1');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'bot-1' },
        data: { botToken: expect.any(String) },
      });
      expect(result.botToken).toBe('new_token_123');
    });
  });

  describe('deleteApplication', () => {
    it('should delete bot application and associated bot user', async () => {
      const mockApp = {
        id: 'app-1',
        ownerId: 'user-1',
        botId: 'bot-1',
      };

      (prisma.botApplication.findUnique as any).mockResolvedValue(mockApp);
      (prisma.botApplication.delete as any).mockResolvedValue(mockApp);
      (prisma.user.delete as any).mockResolvedValue({ id: 'bot-1' });

      const result = await controller.deleteApplication(mockContext, 'app-1');

      expect(prisma.botApplication.delete).toHaveBeenCalledWith({ where: { id: 'app-1' } });
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'bot-1' } });
      expect(result.success).toBe(true);
    });
  });

  describe('installApplication', () => {
    it('should install bot to workspace and provision team & channel definitions', async () => {
      const mockWorkspace = { id: 'ws-1', slug: 'acme-ws' };
      const mockApp = {
        id: 'app-1',
        name: 'Deploy Bot',
        workspaceId: null,
        bot: { id: 'bot-1', name: 'Deploy Bot' },
        channelDefinitions: [
          {
            teamName: 'DevOps',
            channelName: 'deploys',
            teamDescription: 'Deploy logs',
            icon: 'rocket',
            autoPopulateRoles: ['admin'],
          },
        ],
      };

      (prisma.workspace.findUnique as any).mockResolvedValue(mockWorkspace);
      (prisma.botApplication.findUnique as any).mockResolvedValue(mockApp);
      (prisma.workspaceMember.upsert as any).mockResolvedValue({});
      (prisma.botApplication.update as any).mockResolvedValue({});
      (prisma.workspaceTeam.findFirst as any).mockResolvedValue(null);
      (prisma.workspaceTeam.create as any).mockResolvedValue({ id: 'team-1', name: 'DevOps' });
      (prisma.channel.findFirst as any).mockResolvedValue(null);
      (prisma.channel.create as any).mockResolvedValue({ id: 'chan-1', name: 'deploys' });
      (prisma.channelMember.upsert as any).mockResolvedValue({});
      (prisma.channelMember.createMany as any).mockResolvedValue({ count: 1 });
      (prisma.workspaceMember.findMany as any).mockResolvedValue([{ userId: 'admin-user' }]);

      const result = await controller.installApplication(mockContext, 'app-1', {
        workspaceSlug: 'acme-ws',
      });

      expect(prisma.workspaceMember.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { workspaceId_userId: { workspaceId: 'ws-1', userId: 'bot-1' } },
        })
      );
      expect(prisma.workspaceTeam.create).toHaveBeenCalled();
      expect(prisma.channel.create).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.botId).toBe('bot-1');
    });
  });

  describe('listWorkspaceBots', () => {
    it('should return list of bot users installed in a workspace', async () => {
      const mockWorkspace = {
        id: 'ws-1',
        members: [
          {
            id: 'wm-1',
            role: 'admin',
            user: {
              id: 'bot-1',
              name: 'System Bot',
              avatar: null,
              isBot: true,
              botApplication: { id: 'app-1', description: 'System', clientId: 'cid-1' },
            },
          },
        ],
      };

      (prisma.workspace.findUnique as any).mockResolvedValue(mockWorkspace);

      const result = await controller.listWorkspaceBots(mockContext, 'acme-ws');

      expect(prisma.workspace.findUnique).toHaveBeenCalledWith({
        where: { slug: 'acme-ws' },
        select: expect.any(Object),
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('bot-1');
    });
  });
});

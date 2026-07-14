import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { SearchController } from './search.controller';
import { AuthGuard } from '../auth/auth.guard';
import { prisma } from '@repo/database';

// Mock @repo/database prisma
vi.mock('@repo/database', () => ({
  prisma: {
    workspace: {
      findUnique: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
    message: {
      findMany: vi.fn(),
    },
    attachment: {
      findMany: vi.fn(),
    },
    channel: {
      findMany: vi.fn(),
    },
  },
}));

describe('SearchController', () => {
  let controller: SearchController;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SearchController>(SearchController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Authorization and Validation', () => {
    const mockUser = { id: 'user-1', name: 'Alice', username: 'alice' } as any;

    it('should throw NotFoundException when workspace not found', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue(null);

      await expect(
        controller.search(mockUser, 'non-existent-slug', 'hello', 'all', '8')
      ).rejects.toThrow('Workspace not found');
    });

    it('should throw ForbiddenException when user is not a member of the workspace', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue({
        id: 'ws-1',
        members: [],
      });

      await expect(
        controller.search(mockUser, 'my-workspace', 'hello', 'all', '8')
      ).rejects.toThrow('Not a member of this workspace');
    });

    it('should return empty results when search query is empty', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue({
        id: 'ws-1',
        members: [{ id: 'member-1' }],
      });

      const response = await controller.search(mockUser, 'my-workspace', '', 'all', '8');
      expect(response).toEqual({
        query: '',
        results: {
          channels: [],
          members: [],
          messages: [],
          files: [],
        },
      });
    });
  });

  describe('Standardized Payloads and Mapping', () => {
    const mockUser = { id: 'user-1', name: 'Alice', username: 'alice' } as any;

    beforeEach(() => {
      (prisma.workspace.findUnique as any).mockResolvedValue({
        id: 'ws-1',
        members: [{ id: 'member-1' }],
      });
    });

    it('should fall back to image for avatar in members list when avatar is null', async () => {
      const mockMembers = [
        {
          id: 'user-2',
          name: 'Bob',
          email: 'bob@example.com',
          avatar: null,
          image: 'https://avatar-fallback-url',
          status: 'online',
          role: 'member',
        },
        {
          id: 'user-3',
          name: 'Charlie',
          email: 'charlie@example.com',
          avatar: 'https://custom-avatar-url',
          image: null,
          status: 'offline',
          role: 'admin',
        },
      ];

      (prisma.user.findMany as any).mockResolvedValue(mockMembers);
      (prisma.channel.findMany as any).mockResolvedValue([]);
      (prisma.message.findMany as any).mockResolvedValue([]);
      (prisma.attachment.findMany as any).mockResolvedValue([]);

      const response = await controller.search(mockUser, 'my-workspace', 'test-query', 'all', '8');

      expect(response.results.members).toHaveLength(2);
      expect(response.results.members[0]).toEqual({
        id: 'user-2',
        name: 'Bob',
        email: 'bob@example.com',
        avatar: 'https://avatar-fallback-url',
        status: 'online',
        role: 'member',
      });
      expect(response.results.members[1]).toEqual({
        id: 'user-3',
        name: 'Charlie',
        email: 'charlie@example.com',
        avatar: 'https://custom-avatar-url',
        status: 'offline',
        role: 'admin',
      });
      // The redundant image property must be removed
      expect(response.results.members[0]).not.toHaveProperty('image');
      expect(response.results.members[1]).not.toHaveProperty('image');
    });

    it('should fall back to image for avatar in messages list when user avatar is null', async () => {
      const mockMessages = [
        {
          id: 'msg-1',
          content: 'Hello world',
          timestamp: new Date(),
          channelId: 'ch-1',
          threadId: null,
          user: {
            id: 'user-2',
            name: 'Bob',
            avatar: null,
            image: 'https://bob-image',
          },
          channel: {
            id: 'ch-1',
            name: 'general',
            slug: 'general',
          },
        },
      ];

      (prisma.user.findMany as any).mockResolvedValue([]);
      (prisma.channel.findMany as any).mockResolvedValue([]);
      (prisma.message.findMany as any).mockResolvedValue(mockMessages);
      (prisma.attachment.findMany as any).mockResolvedValue([]);

      const response = await controller.search(mockUser, 'my-workspace', 'Hello', 'all', '8');

      expect(response.results.messages).toHaveLength(1);
      expect(response.results.messages[0].user).toEqual({
        id: 'user-2',
        name: 'Bob',
        avatar: 'https://bob-image',
      });
    });

    it('should filter search components based on wants query parameter', async () => {
      (prisma.channel.findMany as any).mockResolvedValue([{ id: 'ch-1', name: 'general' }]);

      // Only search channels
      const response = await controller.search(mockUser, 'my-workspace', 'general', 'channels', '8');

      expect(prisma.channel.findMany).toHaveBeenCalled();
      expect(prisma.user.findMany).not.toHaveBeenCalled();
      expect(prisma.message.findMany).not.toHaveBeenCalled();
      expect(prisma.attachment.findMany).not.toHaveBeenCalled();

      expect(response.results.channels).toHaveLength(1);
      expect(response.results.members).toHaveLength(0);
    });
  });
});

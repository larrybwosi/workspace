import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { EmojisController } from './emojis.controller';
import { AuthGuard } from '../auth/auth.guard';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

// Mock @repo/database prisma
vi.mock('@repo/database', () => ({
  prisma: {
    workspace: {
      findUnique: vi.fn(),
    },
    customEmoji: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { prisma } from '@repo/database';

describe('EmojisController', () => {
  let controller: EmojisController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmojisController],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<EmojisController>(EmojisController);
    vi.clearAllMocks();
  });

  const mockUser = { id: 'user-1', name: 'Alice' } as any;
  const mockWorkspace = { id: 'ws-1', slug: 'my-workspace' };

  describe('getEmojis', () => {
    it('should return emojis for a workspace member', async () => {
      const mockEmojis = [{ id: 'emoji-1', name: 'parrot' }];

      (prisma.workspace.findUnique as any).mockResolvedValue({
        ...mockWorkspace,
        members: [{ userId: mockUser.id, role: 'member' }],
      });
      (prisma.customEmoji.findMany as any).mockResolvedValue(mockEmojis);

      const result = await controller.getEmojis(mockUser, 'my-workspace');
      expect(result).toEqual(mockEmojis);
    });

    it('should throw NotFoundException if workspace does not exist', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue(null);

      await expect(controller.getEmojis(mockUser, 'invalid')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue({
        ...mockWorkspace,
        members: [], // User not in list
      });

      await expect(controller.getEmojis(mockUser, 'my-workspace')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('createEmoji', () => {
    const createDto = { name: 'parrot', shortcode: 'parrot', imageUrl: 'http://example.com/parrot.png' };

    it('should create an emoji for workspace owner', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue({
        ...mockWorkspace,
        members: [{ userId: mockUser.id, role: 'owner' }],
      });
      (prisma.customEmoji.create as any).mockResolvedValue({ id: 'emoji-1', ...createDto });

      const result = await controller.createEmoji(mockUser, 'my-workspace', createDto);
      expect(result).toHaveProperty('id', 'emoji-1');
    });

    it('should throw ForbiddenException if user is only a member', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue({
        ...mockWorkspace,
        members: [{ userId: mockUser.id, role: 'member' }],
      });

      await expect(controller.createEmoji(mockUser, 'my-workspace', createDto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if required fields are missing', async () => {
      (prisma.workspace.findUnique as any).mockResolvedValue({
        ...mockWorkspace,
        members: [{ userId: mockUser.id, role: 'owner' }],
      });

      await expect(controller.createEmoji(mockUser, 'my-workspace', { name: 'test' } as any)).rejects.toThrow(BadRequestException);
    });
  });
});

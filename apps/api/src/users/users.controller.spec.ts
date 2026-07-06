import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { AuthGuard } from '../auth/auth.guard';
import { BadRequestException } from '@nestjs/common';
import { prisma } from '@repo/database';

// Mock @repo/database prisma
vi.mock('@repo/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    deviceToken: {
      upsert: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    blockedUser: {
      upsert: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
    vi.clearAllMocks();
  });

  const mockUser = { id: 'user-1', name: 'Alice' } as any;

  describe('getUser', () => {
    it('should return a user profile if found', async () => {
      const mockFoundUser = {
        id: 'user-2',
        name: 'Bob',
        username: 'bob',
        avatar: 'bob-avatar',
      };
      (prisma.user.findUnique as any).mockResolvedValue(mockFoundUser);

      const result = await controller.getUser('user-2');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-2' },
        select: expect.any(Object),
      });
      expect(result).toEqual(mockFoundUser);
    });

    it('should throw NotFoundException if user is not found', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);
      await expect(controller.getUser('non-existent')).rejects.toThrow();
    });
  });

  describe('registerDeviceToken', () => {
    it('should use upsert for atomic registration', async () => {
      const body = {
        token: 'token-123',
        platform: 'ios',
        deviceInfo: { model: 'iPhone' },
      };

      const mockUpsertResult = { id: 'dt-1', ...body, userId: 'user-1' };
      (prisma.deviceToken.upsert as any).mockResolvedValue(mockUpsertResult);

      const result = await controller.registerDeviceToken(mockUser, body);

      expect(prisma.deviceToken.upsert).toHaveBeenCalledWith({
        where: { token: 'token-123' },
        update: {
          userId: 'user-1',
          platform: 'ios',
          deviceInfo: { model: 'iPhone' },
          isActive: true,
          lastUsedAt: expect.any(Date),
        },
        create: {
          userId: 'user-1',
          token: 'token-123',
          platform: 'ios',
          deviceInfo: { model: 'iPhone' },
        },
      });
      expect(result).toEqual(mockUpsertResult);
    });

    it('should throw BadRequestException if token is missing', async () => {
      const body = { platform: 'ios' };
      await expect(controller.registerDeviceToken(mockUser, body)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if platform is missing', async () => {
      const body = { token: 'token-123' };
      await expect(controller.registerDeviceToken(mockUser, body)).rejects.toThrow(BadRequestException);
    });
  });
});

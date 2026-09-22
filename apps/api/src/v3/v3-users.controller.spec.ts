import { describe, it, expect, vi, beforeEach } from 'vitest';
import { V3UsersController } from './v3-users.controller';
import { prisma } from '@repo/database';
import { ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import * as sharedModule from '@repo/shared';
import { auth } from '@repo/auth';

vi.mock('@repo/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    member: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@repo/shared', async (importOriginal) => {
  const actual = await importOriginal<typeof sharedModule>();
  return {
    ...actual,
    sendSetPasswordEmail: vi.fn().mockResolvedValue({ id: 'test-email-id' }),
  };
});

vi.mock('@repo/auth', () => ({
  auth: {
    api: {
      requestPasswordReset: vi.fn().mockResolvedValue({ url: 'http://localhost:3001/reset-password?token=mock' }),
    },
  },
}));

describe('V3UsersController', () => {
  let controller: V3UsersController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new V3UsersController();
  });

  describe('createUser', () => {
    it('throws ForbiddenException if missing users:write scope', async () => {
      const context = { scopes: ['users:read'] } as any;
      await expect(
        controller.createUser(context, { email: 'test@example.com' })
      ).rejects.toThrow(ForbiddenException);
    });

    it('creates a new user and sends set password email when user does not exist', async () => {
      const context = { scopes: ['users:write'], organizationId: 'org_1' } as any;
      (prisma.user.findUnique as any).mockResolvedValue(null);
      (prisma.user.create as any).mockResolvedValue({
        id: 'usr_1',
        email: 'new@example.com',
        name: 'New User',
        avatar: null,
        createdAt: new Date(),
      });
      (prisma.member.findFirst as any).mockResolvedValue(null);
      (prisma.member.create as any).mockResolvedValue({});

      const result = await controller.createUser(context, {
        email: 'new@example.com',
        name: 'New User',
      });

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'new@example.com',
          name: 'New User',
          avatar: null,
        },
      });

      expect((auth.api as any).requestPasswordReset).toHaveBeenCalledWith({
        body: { email: 'new@example.com', redirectTo: 'http://localhost:3001/reset-password' },
      });

      expect(sharedModule.sendSetPasswordEmail).toHaveBeenCalledWith({
        to: 'new@example.com',
        url: 'http://localhost:3001/reset-password?token=mock',
        user: {
          name: 'New User',
          email: 'new@example.com',
        },
        isNewUser: true,
      });

      expect(result.success).toBe(true);
      expect(result.data.user.email).toBe('new@example.com');
    });

    it('updates existing user and does not send set password email', async () => {
      const context = { scopes: ['users:write'] } as any;
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'usr_1',
        email: 'existing@example.com',
        name: 'Old Name',
      });
      (prisma.user.update as any).mockResolvedValue({
        id: 'usr_1',
        email: 'existing@example.com',
        name: 'Updated Name',
        avatar: null,
        createdAt: new Date(),
      });

      const result = await controller.createUser(context, {
        email: 'existing@example.com',
        name: 'Updated Name',
      });

      expect(prisma.user.update).toHaveBeenCalled();
      expect(sharedModule.sendSetPasswordEmail).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe('getUserByEmail', () => {
    it('returns user profile if found', async () => {
      const context = { scopes: ['users:read'] } as any;
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'usr_1',
        email: 'found@example.com',
        name: 'Found User',
      });

      const res = await controller.getUserByEmail(context, 'found@example.com');
      expect(res.data.user.email).toBe('found@example.com');
    });

    it('throws NotFoundException if user not found', async () => {
      const context = { scopes: ['users:read'] } as any;
      (prisma.user.findUnique as any).mockResolvedValue(null);

      await expect(controller.getUserByEmail(context, 'notfound@example.com')).rejects.toThrow(
        NotFoundException
      );
    });
  });
});

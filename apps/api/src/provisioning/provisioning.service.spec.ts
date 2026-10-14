import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ProvisioningService } from './provisioning.service';
import { prisma } from '@repo/database';
import * as sharedModule from '@repo/shared';
import { auth } from '@repo/auth';

vi.mock('@repo/database', () => ({
  prisma: {
    $transaction: vi.fn(),
  },
}));

vi.mock('@repo/shared', async () => {
  const actual = await vi.importActual('@repo/shared');
  return {
    ...actual,
    sendSetPasswordEmail: vi.fn().mockResolvedValue({ id: 'test-email-id' }),
  };
});

vi.mock('@repo/auth', () => ({
  auth: {
    api: {
      requestPasswordReset: vi.fn().mockResolvedValue({ url: 'http://localhost:3001/verify-email?token=mocktoken' }),
    },
  },
}));

describe('ProvisioningService', () => {
  let service: ProvisioningService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ProvisioningService();
  });

  describe('provisionWorkspace', () => {
    it('should successfully provision a workspace with batch channels, initial members, and system bot', async () => {
      const mockTx = {
        workspace: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({
            id: 'ws-123',
            slug: 'acme',
            name: 'Acme Corp',
          }),
        },
        user: {
          findUnique: vi
            .fn()
            .mockImplementation(({ where }) => {
              if (where.email === 'owner@acme.com') {
                return Promise.resolve({ id: 'user-owner', email: 'owner@acme.com', name: 'Owner' });
              }
              if (where.email === 'member1@acme.com') {
                return Promise.resolve({ id: 'user-m1', email: 'member1@acme.com', name: 'Member1' });
              }
              return Promise.resolve(null);
            }),
          create: vi.fn().mockResolvedValue({
            id: 'bot_123',
            name: 'System Bot',
          }),
        },
        channel: {
          createMany: vi.fn().mockResolvedValue({ count: 2 }),
        },
        workspaceMember: {
          upsert: vi.fn().mockResolvedValue({ id: 'wm-1' }),
          create: vi.fn().mockResolvedValue({ id: 'wm-bot' }),
        },
        botApplication: {
          create: vi.fn().mockResolvedValue({
            id: 'botapp-1',
            clientId: 'bot_client_123',
            clientSecret: 'secret_123',
          }),
        },
        workspaceAuditLog: {
          create: vi.fn().mockResolvedValue({ id: 'log-1' }),
        },
      };

      (prisma.$transaction as any).mockImplementation((cb: any) => cb(mockTx));

      const result = await service.provisionWorkspace(
        { organizationId: 'org-123', userId: 'user-owner', clientId: 'm2m-client' },
        {
          name: 'Acme Corp',
          slug: 'acme',
          ownerEmail: 'owner@acme.com',
          channels: ['general', 'random'],
          initialMembers: [{ email: 'member1@acme.com', role: 'admin' }],
        }
      );

      expect(result).toEqual({
        success: true,
        workspace: {
          id: 'ws-123',
          slug: 'acme',
          name: 'Acme Corp',
        },
        bot: {
          id: 'botapp-1',
          clientId: 'bot_client_123',
          clientSecret: 'secret_123',
        },
      });

      // Existing users -> no emails sent
      expect(sharedModule.sendSetPasswordEmail).not.toHaveBeenCalled();
    });

    it('should send verification email to newly created owner and initial members', async () => {
      const mockTx = {
        workspace: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({
            id: 'ws-123',
            slug: 'acme',
            name: 'Acme Corp',
          }),
        },
        user: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockImplementation(({ data }) => {
            if (data.email === 'newowner@acme.com') {
              return Promise.resolve({ id: 'user-newowner', email: 'newowner@acme.com', name: 'newowner' });
            }
            if (data.email === 'newmember@acme.com') {
              return Promise.resolve({ id: 'user-newmember', email: 'newmember@acme.com', name: 'New Member' });
            }
            return Promise.resolve({ id: 'bot_123', name: 'System Bot' });
          }),
        },
        channel: {
          createMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
        workspaceMember: {
          upsert: vi.fn().mockResolvedValue({ id: 'wm-1' }),
          create: vi.fn().mockResolvedValue({ id: 'wm-bot' }),
        },
        botApplication: {
          create: vi.fn().mockResolvedValue({
            id: 'botapp-1',
            clientId: 'bot_client_123',
            clientSecret: 'secret_123',
          }),
        },
        workspaceAuditLog: {
          create: vi.fn().mockResolvedValue({ id: 'log-1' }),
        },
      };

      (prisma.$transaction as any).mockImplementation((cb: any) => cb(mockTx));

      const result = await service.provisionWorkspace(
        {},
        {
          name: 'Acme Corp',
          slug: 'acme',
          ownerEmail: 'newowner@acme.com',
          initialMembers: [{ email: 'newmember@acme.com', name: 'New Member' }],
        }
      );

      expect(result.success).toBe(true);

      // Verify emails were sent for both new users
      expect(sharedModule.sendSetPasswordEmail).toHaveBeenCalledTimes(2);
      expect(sharedModule.sendSetPasswordEmail).toHaveBeenCalledWith({
        to: 'newowner@acme.com',
        url: 'http://localhost:3001/verify-email?token=mocktoken',
        user: { name: 'newowner', email: 'newowner@acme.com' },
        isNewUser: true,
      });
      expect(sharedModule.sendSetPasswordEmail).toHaveBeenCalledWith({
        to: 'newmember@acme.com',
        url: 'http://localhost:3001/verify-email?token=mocktoken',
        user: { name: 'New Member', email: 'newmember@acme.com' },
        isNewUser: true,
      });
    });

    it('should throw BadRequestException if workspace slug is already taken', async () => {
      const mockTx = {
        workspace: {
          findUnique: vi.fn().mockResolvedValue({ id: 'existing-ws' }),
        },
      };

      (prisma.$transaction as any).mockImplementation((cb: any) => cb(mockTx));

      await expect(
        service.provisionWorkspace(
          {},
          { name: 'Acme Corp', slug: 'acme', ownerEmail: 'owner@acme.com' }
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('should wrap unexpected database errors in InternalServerErrorException', async () => {
      (prisma.$transaction as any).mockRejectedValue(new Error('Unexpected DB Failure'));

      await expect(
        service.provisionWorkspace(
          {},
          { name: 'Acme Corp', slug: 'acme', ownerEmail: 'owner@acme.com' }
        )
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ProvisioningService } from './provisioning.service';
import { prisma } from '@repo/database';

vi.mock('@repo/database', () => ({
  prisma: {
    $transaction: vi.fn(),
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
                return Promise.resolve({ id: 'user-owner', email: 'owner@acme.com' });
              }
              if (where.email === 'member1@acme.com') {
                return Promise.resolve({ id: 'user-m1', email: 'member1@acme.com' });
              }
              return Promise.resolve(null);
            }),
          create: vi.fn().mockResolvedValue({
            id: 'bot_123',
            name: 'System Bot',
          }),
        },
        organization: {
          findUnique: vi.fn().mockResolvedValue({
            members: [{ id: 'org-member-1' }],
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

      expect(mockTx.channel.createMany).toHaveBeenCalledWith({
        data: [
          { workspaceId: 'ws-123', name: 'general', icon: 'hash', type: 'channel', createdById: 'user-owner' },
          { workspaceId: 'ws-123', name: 'random', icon: 'hash', type: 'channel', createdById: 'user-owner' },
        ],
      });

      expect(mockTx.organization.findUnique).toHaveBeenCalledWith({
        where: { id: 'org-123' },
        select: { members: { where: { userId: 'user-owner' }, select: { id: true } } },
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

    it('should throw BadRequestException if owner user is not found', async () => {
      const mockTx = {
        workspace: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
        user: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      };

      (prisma.$transaction as any).mockImplementation((cb: any) => cb(mockTx));

      await expect(
        service.provisionWorkspace(
          {},
          { name: 'Acme Corp', slug: 'acme', ownerEmail: 'nonexistent@acme.com' }
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if owner is not a member of the M2M organization', async () => {
      const mockTx = {
        workspace: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
        user: {
          findUnique: vi.fn().mockResolvedValue({ id: 'user-owner', email: 'owner@acme.com' }),
        },
        organization: {
          findUnique: vi.fn().mockResolvedValue({ members: [] }),
        },
      };

      (prisma.$transaction as any).mockImplementation((cb: any) => cb(mockTx));

      await expect(
        service.provisionWorkspace(
          { organizationId: 'org-123' },
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

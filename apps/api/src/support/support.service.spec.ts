import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { SupportService } from './support.service';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { prisma } from '@repo/database';

// Mock @repo/database
vi.mock('@repo/database', () => ({
  prisma: {
    customerProfile: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
    channel: {
      create: vi.fn(),
    },
    supportTicket: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    message: {
      create: vi.fn(),
    },
    workspaceMember: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock @repo/shared/server
vi.mock('@repo/shared/server', () => ({
  getAblyRest: vi.fn(),
  AblyChannels: {
    channel: vi.fn((id: string) => `channel:${id}`),
  },
  AblyEvents: {
    MESSAGE_SENT: 'message.sent',
  },
}));

describe('SupportService', () => {
  let service: SupportService;
  const mockPrisma = prisma as any;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [SupportService],
    }).compile();

    service = module.get<SupportService>(SupportService);
  });

  describe('createTicket', () => {
    it('should create a ticket and initial message successfully via nested operations', async () => {
      const workspaceId = 'ws-1';
      const customerUserId = 'user-1';
      const subject = 'Help me';
      const initialMessage = 'I have a problem';

      const mockTicket = {
        id: 'ticket-1',
        workspaceId,
        customerId: 'cp-1',
        subject,
        channelId: 'ch-1',
        customer: { id: 'cp-1', userId: customerUserId, user: { id: customerUserId, name: 'Customer' } },
        channel: { id: 'ch-1' },
      };

      mockPrisma.supportTicket.create.mockResolvedValue(mockTicket);

      const result = await service.createTicket(workspaceId, customerUserId, subject, initialMessage);

      expect(mockPrisma.supportTicket.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subject,
            workspace: { connect: { id: workspaceId } },
            customer: { connect: { userId: customerUserId } },
            channel: expect.objectContaining({
              create: expect.objectContaining({
                type: 'support_ticket',
                workspace: { connect: { id: workspaceId } },
                messages: expect.objectContaining({
                  create: expect.objectContaining({
                    content: initialMessage,
                  }),
                }),
              }),
            }),
          }),
        })
      );
      expect(result.id).toBe('ticket-1');
    });

    it('should throw BadRequestException if customer profile is not found (Prisma P2025)', async () => {
      const error = new Error('Record not found');
      (error as any).code = 'P2025';
      mockPrisma.supportTicket.create.mockRejectedValue(error);

      await expect(service.createTicket('ws-1', 'user-1', 'subject')).rejects.toThrow(BadRequestException);
      await expect(service.createTicket('ws-1', 'user-1', 'subject')).rejects.toThrow('Customer profile not found');
    });
  });

  describe('getTickets', () => {
    it('should return tickets for a workspace member (admin)', async () => {
      const workspaceId = 'ws-1';
      const userId = 'admin-1';
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({ role: 'admin' });
      mockPrisma.supportTicket.findMany.mockResolvedValue([{ id: 't-1' }]);

      const result = await service.getTickets(workspaceId, userId);

      expect(mockPrisma.supportTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { workspaceId } })
      );
      expect(result).toHaveLength(1);
    });

    it('should return tickets for a customer', async () => {
      const workspaceId = 'ws-1';
      const userId = 'customer-1';
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);
      mockPrisma.customerProfile.findUnique.mockResolvedValue({ id: 'cp-1', workspaceId });
      mockPrisma.supportTicket.findMany.mockResolvedValue([{ id: 't-1' }]);

      const result = await service.getTickets(workspaceId, userId);

      expect(mockPrisma.supportTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { workspaceId, customerId: 'cp-1' } })
      );
      expect(result).toHaveLength(1);
    });

    it('should throw ForbiddenException if user has no access', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);
      mockPrisma.customerProfile.findUnique.mockResolvedValue(null);

      await expect(service.getTickets('ws-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });
});

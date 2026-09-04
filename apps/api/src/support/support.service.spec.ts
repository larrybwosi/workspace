import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { SupportService } from './support.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
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
    liveChatSession: {
      create: vi.fn(),
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
  publishRealtime: vi.fn(),
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

  describe('endLiveChat (BOLA hardening)', () => {
    it('should throw NotFoundException if live chat session does not exist', async () => {
      mockPrisma.liveChatSession.findUnique.mockResolvedValue(null);

      await expect(service.endLiveChat('session-404', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is neither session customer nor workspace agent', async () => {
      mockPrisma.liveChatSession.findUnique.mockResolvedValue({
        id: 's-1',
        workspaceId: 'ws-1',
        customer: { userId: 'customer-1' },
      });
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null); // not agent

      await expect(service.endLiveChat('s-1', 'unauthorized-user')).rejects.toThrow(ForbiddenException);
    });

    it('should allow customer in session to end live chat', async () => {
      mockPrisma.liveChatSession.findUnique.mockResolvedValue({
        id: 's-1',
        workspaceId: 'ws-1',
        customer: { userId: 'customer-1' },
      });
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);
      mockPrisma.liveChatSession.update.mockResolvedValue({ id: 's-1', status: 'ENDED' });

      const res = await service.endLiveChat('s-1', 'customer-1');
      expect(res.status).toBe('ENDED');
    });

    it('should allow workspace admin to end live chat', async () => {
      mockPrisma.liveChatSession.findUnique.mockResolvedValue({
        id: 's-1',
        workspaceId: 'ws-1',
        customer: { userId: 'customer-1' },
      });
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({ role: 'admin' });
      mockPrisma.liveChatSession.update.mockResolvedValue({ id: 's-1', status: 'ENDED' });

      const res = await service.endLiveChat('s-1', 'admin-1');
      expect(res.status).toBe('ENDED');
    });
  });

  describe('updateTicketStatus (BOLA hardening)', () => {
    it('should throw NotFoundException if ticket does not exist', async () => {
      mockPrisma.supportTicket.findUnique.mockResolvedValue(null);

      await expect(service.updateTicketStatus('ticket-404', 'RESOLVED', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not ticket owner and not workspace agent', async () => {
      mockPrisma.supportTicket.findUnique.mockResolvedValue({
        id: 't-1',
        workspaceId: 'ws-1',
        customer: { userId: 'customer-1' },
      });
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(service.updateTicketStatus('t-1', 'RESOLVED', 'other-user')).rejects.toThrow(ForbiddenException);
    });

    it('should allow ticket owner to update status', async () => {
      mockPrisma.supportTicket.findUnique.mockResolvedValue({
        id: 't-1',
        workspaceId: 'ws-1',
        customer: { userId: 'customer-1' },
      });
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);
      mockPrisma.supportTicket.update.mockResolvedValue({ id: 't-1', status: 'CLOSED' });

      const res = await service.updateTicketStatus('t-1', 'CLOSED', 'customer-1');
      expect(res.status).toBe('CLOSED');
    });

    it('should allow workspace agent to resolve ticket', async () => {
      mockPrisma.supportTicket.findUnique.mockResolvedValue({
        id: 't-1',
        workspaceId: 'ws-1',
        customer: { userId: 'customer-1' },
      });
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({ role: 'admin' });
      mockPrisma.supportTicket.update.mockResolvedValue({ id: 't-1', status: 'RESOLVED', channelId: 'ch-1' });

      const res = await service.updateTicketStatus('t-1', 'RESOLVED', 'admin-1');
      expect(res.status).toBe('RESOLVED');
    });
  });

  describe('assignTicket (BOLA hardening)', () => {
    it('should throw NotFoundException if ticket does not exist', async () => {
      mockPrisma.supportTicket.findUnique.mockResolvedValue(null);

      await expect(service.assignTicket('t-404', 'agent-1', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if requester is not a workspace agent/admin', async () => {
      mockPrisma.supportTicket.findUnique.mockResolvedValue({ id: 't-1', workspaceId: 'ws-1' });
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null); // not agent

      await expect(service.assignTicket('t-1', 'agent-1', 'customer-1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if assignee is not an authorized agent in workspace', async () => {
      mockPrisma.supportTicket.findUnique.mockResolvedValue({ id: 't-1', workspaceId: 'ws-1' });
      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({ role: 'admin' }); // requester agent check
      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce(null); // assignee check fails

      await expect(service.assignTicket('t-1', 'invalid-agent', 'admin-1')).rejects.toThrow(BadRequestException);
    });

    it('should assign ticket successfully when requester and assignee are workspace agents', async () => {
      mockPrisma.supportTicket.findUnique.mockResolvedValue({ id: 't-1', workspaceId: 'ws-1' });
      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({ role: 'admin' }); // requester
      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({ role: 'moderator' }); // assignee
      mockPrisma.supportTicket.update.mockResolvedValue({ id: 't-1', assigneeId: 'agent-1' });

      const res = await service.assignTicket('t-1', 'agent-1', 'admin-1');
      expect(res.assigneeId).toBe('agent-1');
    });
  });

  describe('createCustomerProfile (BOLA hardening)', () => {
    it('should allow user to update their own customer profile', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);
      mockPrisma.customerProfile.upsert.mockResolvedValue({ userId: 'user-1', workspaceId: 'ws-1', company: 'Acme' });

      const res = await service.createCustomerProfile('ws-1', 'user-1', 'user-1', { company: 'Acme' });
      expect(res.company).toBe('Acme');
    });

    it('should throw ForbiddenException if user tries to update another user profile without agent access', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(
        service.createCustomerProfile('ws-1', 'target-user', 'requesting-user', { company: 'Evil' })
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow workspace admin to update another user customer profile', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({ role: 'admin' });
      mockPrisma.customerProfile.upsert.mockResolvedValue({ userId: 'target-user', workspaceId: 'ws-1', company: 'Acme' });

      const res = await service.createCustomerProfile('ws-1', 'target-user', 'admin-1', { company: 'Acme' });
      expect(res.company).toBe('Acme');
    });
  });

  describe('getCustomerProfiles (BOLA hardening)', () => {
    it('should throw ForbiddenException if requesting user is not a workspace agent/admin', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(service.getCustomerProfiles('ws-1', 'regular-user')).rejects.toThrow(ForbiddenException);
    });

    it('should return customer profiles if requesting user is workspace admin', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({ role: 'admin' });
      mockPrisma.customerProfile.findMany.mockResolvedValue([{ id: 'cp-1' }]);

      const profiles = await service.getCustomerProfiles('ws-1', 'admin-1');
      expect(profiles).toHaveLength(1);
    });
  });
});

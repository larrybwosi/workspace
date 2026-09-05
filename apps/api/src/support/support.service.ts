import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { prisma } from '@repo/database';
import { AblyChannels, AblyEvents, publishRealtime } from '@repo/shared/server';

@Injectable()
export class SupportService {
  /**
   * Helper to verify if a user has agent/admin/owner/moderator permissions in a workspace.
   */
  private async checkWorkspaceAgentAccess(workspaceId: string, userId: string): Promise<boolean> {
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
    });
    return !!member && ['owner', 'admin', 'moderator'].includes(member.role);
  }

  async createTicket(workspaceId: string, customerUserId: string, subject: string, initialMessage?: string) {
    /**
     * ⚡ Performance Optimization:
     * Consolidates customer lookup, channel creation, ticket creation, and initial message creation
     * into a single database round-trip using nested Prisma operations.
     * Reduces database RTT from 4 down to 1.
     */
    try {
      const ticket = await prisma.supportTicket.create({
        data: {
          subject,
          status: 'OPEN',
          workspace: { connect: { id: workspaceId } },
          customer: { connect: { userId: customerUserId } },
          channel: {
            create: {
              name: `ticket-${Math.random().toString(36).substring(7)}`,
              icon: '🎫',
              type: 'support_ticket',
              workspace: { connect: { id: workspaceId } },
              isPrivate: true,
              members: {
                create: {
                  userId: customerUserId,
                  role: 'member',
                },
              },
              messages: initialMessage
                ? {
                    create: {
                      userId: customerUserId,
                      content: initialMessage,
                      messageType: 'support_request',
                    },
                  }
                : undefined,
            },
          },
        },
        include: {
          customer: {
            include: {
              user: true,
            },
          },
          channel: true,
        },
      });

      return ticket;
    } catch (error) {
      // Prisma error code for 'An operation failed because it depends on one or more records that were required but not found'
      // This happens when 'connect: { userId: customerUserId }' fails because the customer profile doesn't exist.
      if ((error as any).code === 'P2025') {
        throw new BadRequestException('Customer profile not found');
      }
      throw error;
    }
  }

  async getTickets(workspaceId: string, userId: string) {
    // Check if user is a workspace member (admin/agent)
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
    });

    if (member && ['owner', 'admin', 'moderator'].includes(member.role)) {
      return prisma.supportTicket.findMany({
        where: { workspaceId },
        include: {
          customer: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatar: true },
              },
            },
          },
          assignee: {
            select: { id: true, name: true, avatar: true },
          },
          channel: true,
        },
        orderBy: {
          lastMessageAt: 'desc',
        },
      });
    }

    // Otherwise, check if user is a customer
    const profile = await prisma.customerProfile.findUnique({
      where: { userId },
    });

    if (profile && profile.workspaceId === workspaceId) {
      return prisma.supportTicket.findMany({
        where: { workspaceId, customerId: profile.id },
        include: { channel: true },
      });
    }

    throw new ForbiddenException('You do not have access to support tickets in this workspace');
  }

  async startLiveChat(workspaceId: string, customerUserId?: string, metadata?: any) {
    // Create a temporary channel for live chat
    const channel = await prisma.channel.create({
      data: {
        name: `chat-${Math.random().toString(36).substring(7)}`,
        icon: '💬',
        type: 'live_chat',
        workspaceId,
        isPrivate: true,
        members: customerUserId ? { create: { userId: customerUserId, role: 'member' } } : undefined,
      },
    });

    let customerProfileId: string | undefined;
    if (customerUserId) {
      const profile = await prisma.customerProfile.findUnique({ where: { userId: customerUserId } });
      customerProfileId = profile?.id;
    }

    const session = await prisma.liveChatSession.create({
      data: {
        workspaceId,
        customerId: customerProfileId,
        channelId: channel.id,
        status: 'ACTIVE',
        metadata,
      },
      include: {
        channel: true,
      },
    });

    return session;
  }

  /**
   * THREAT MITIGATION: BOLA/IDOR Prevention
   * Validates that the requesting user is either the customer in this session or an authorized workspace agent/admin.
   */
  async endLiveChat(sessionId: string, requestingUserId: string) {
    const session = await prisma.liveChatSession.findUnique({
      where: { id: sessionId },
      include: {
        customer: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Live chat session not found');
    }

    const isCustomer = session.customer?.userId === requestingUserId;
    const isAgent = await this.checkWorkspaceAgentAccess(session.workspaceId, requestingUserId);

    if (!isCustomer && !isAgent) {
      throw new ForbiddenException('You do not have access to end this live chat session');
    }

    return prisma.liveChatSession.update({
      where: { id: sessionId },
      data: {
        status: 'ENDED',
        endedAt: new Date(),
      },
    });
  }

  /**
   * THREAT MITIGATION: BOLA/IDOR Prevention
   * Validates that the requesting user is either the customer who owns the ticket or an authorized workspace agent/admin.
   */
  async updateTicketStatus(ticketId: string, status: string, requestingUserId: string) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { customer: true, channel: true },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const isCustomer = ticket.customer?.userId === requestingUserId;
    const isAgent = await this.checkWorkspaceAgentAccess(ticket.workspaceId, requestingUserId);

    if (!isCustomer && !isAgent) {
      throw new ForbiddenException('You do not have access to update this ticket status');
    }

    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status },
      include: { channel: true },
    });

    if (status === 'RESOLVED' || status === 'CLOSED') {
      if (updatedTicket.channelId) {
        await publishRealtime(AblyChannels.channel(updatedTicket.channelId), AblyEvents.MESSAGE_SENT, {
          content: `This ticket has been marked as ${status.toLowerCase()}.`,
          messageType: 'system_notification',
          timestamp: new Date(),
        });
      }
    }

    return updatedTicket;
  }

  /**
   * THREAT MITIGATION: BOLA/IDOR Prevention
   * Validates that the requesting user is an authorized workspace agent/admin/owner before allowing ticket assignment.
   */
  async assignTicket(ticketId: string, assigneeId: string | null, requestingUserId: string) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const isRequesterAgent = await this.checkWorkspaceAgentAccess(ticket.workspaceId, requestingUserId);
    if (!isRequesterAgent) {
      throw new ForbiddenException('You do not have access to assign tickets in this workspace');
    }

    if (assigneeId) {
      const member = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: ticket.workspaceId,
            userId: assigneeId,
          },
        },
      });

      if (!member || !['owner', 'admin', 'moderator'].includes(member.role)) {
        throw new BadRequestException('User is not an authorized agent in this workspace');
      }
    }

    return prisma.supportTicket.update({
      where: { id: ticketId },
      data: { assigneeId },
      include: {
        assignee: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });
  }

  async updateLastMessageAt(ticketId: string) {
    return prisma.supportTicket.update({
      where: { id: ticketId },
      data: { lastMessageAt: new Date() },
    });
  }

  /**
   * THREAT MITIGATION: BOLA/IDOR Prevention
   * Ensures target user is modifying their own profile or requesting user is an authorized workspace agent/admin.
   */
  async createCustomerProfile(workspaceId: string, targetUserId: string, requestingUserId: string, data: any) {
    const isSelf = targetUserId === requestingUserId;
    const isAgent = await this.checkWorkspaceAgentAccess(workspaceId, requestingUserId);

    if (!isSelf && !isAgent) {
      throw new ForbiddenException('You do not have permission to modify this customer profile');
    }

    return prisma.customerProfile.upsert({
      where: { userId: targetUserId },
      update: {
        workspaceId,
        company: data.company,
        jobTitle: data.jobTitle,
        crmId: data.crmId,
        metadata: data.metadata,
        tags: data.tags,
      },
      create: {
        userId: targetUserId,
        workspaceId,
        company: data.company,
        jobTitle: data.jobTitle,
        crmId: data.crmId,
        metadata: data.metadata,
        tags: data.tags,
      },
    });
  }

  /**
   * THREAT MITIGATION: BOLA & PII Data Leakage Prevention
   * Restricts customer profile lists to workspace agents/admins.
   */
  async getCustomerProfiles(workspaceId: string, requestingUserId: string) {
    const isAgent = await this.checkWorkspaceAgentAccess(workspaceId, requestingUserId);
    if (!isAgent) {
      throw new ForbiddenException('You do not have access to view customer profiles for this workspace');
    }

    return prisma.customerProfile.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  }
}

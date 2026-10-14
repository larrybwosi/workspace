import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { prisma } from '@repo/database';
import { AblyChannels, AblyEvents, publishRealtime } from '@repo/shared/server';

@Injectable()
export class SupportService {
  /**
   * Helper to check if a member role satisfies agent/admin/owner/moderator permissions.
   */
  private checkAgentRole(role?: string): boolean {
    return !!role && ['owner', 'admin', 'moderator'].includes(role);
  }

  /**
   * Helper to verify if a user has agent/admin/owner/moderator permissions in a workspace.
   */
  private async checkWorkspaceAgentAccess(workspaceId: string, userId: string): Promise<boolean> {
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
    });
    return this.checkAgentRole(member?.role);
  }

  async createTicket(workspaceId: string, customerUserId: string, subject: string, initialMessage?: string) {
    // Ensure the customer profile exists for customerUserId in this workspace (or upsert if missing)
    const customerProfile = await prisma.customerProfile.upsert({
      where: { userId: customerUserId },
      update: { workspaceId },
      create: {
        userId: customerUserId,
        workspaceId,
      },
    });

    const ticket = await prisma.supportTicket.create({
      data: {
        subject,
        status: 'OPEN',
        workspace: { connect: { id: workspaceId } },
        customer: { connect: { id: customerProfile.id } },
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
   *
   * ⚡ Performance Optimization:
   * Eagerly pre-fetches the requesting user's workspace membership via nested `workspace.members` selection.
   * Performs agent authorization in-memory, reducing database round-trips (RTT) from 2 down to 1.
   */
  async endLiveChat(sessionId: string, requestingUserId: string) {
    const session = await prisma.liveChatSession.findUnique({
      where: { id: sessionId },
      include: {
        customer: true,
        workspace: {
          select: {
            members: {
              where: { userId: requestingUserId },
              select: { role: true },
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Live chat session not found');
    }

    const isCustomer = session.customer?.userId === requestingUserId;
    const isAgent = session.workspace?.members !== undefined
      ? this.checkAgentRole(session.workspace.members[0]?.role)
      : await this.checkWorkspaceAgentAccess(session.workspaceId, requestingUserId);

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
   *
   * ⚡ Performance Optimization:
   * Eagerly pre-fetches the requesting user's workspace membership via nested `workspace.members` selection.
   * Performs agent authorization in-memory, reducing database round-trips (RTT) from 2 down to 1 before ticket mutation.
   */
  async updateTicketStatus(ticketId: string, status: string, requestingUserId: string) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        customer: true,
        channel: true,
        workspace: {
          select: {
            members: {
              where: { userId: requestingUserId },
              select: { role: true },
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const isCustomer = ticket.customer?.userId === requestingUserId;
    const isAgent = ticket.workspace?.members !== undefined
      ? this.checkAgentRole(ticket.workspace.members[0]?.role)
      : await this.checkWorkspaceAgentAccess(ticket.workspaceId, requestingUserId);

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
   *
   * ⚡ Performance Optimization:
   * Consolidates ticket lookup and workspace agent checks for both requesting user and assignee into a single
   * `findUnique` query with nested `workspace.members` selection.
   * This reduces database round-trips (RTT) from 3-4 down to 2.
   */
  async assignTicket(ticketId: string, assigneeId: string | null, requestingUserId: string) {
    const targetUserIds = assigneeId ? [requestingUserId, assigneeId] : [requestingUserId];
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        workspaceId: true,
        workspace: {
          select: {
            members: {
              where: {
                userId: { in: targetUserIds },
              },
              select: { userId: true, role: true },
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    let isRequesterAgent = false;
    let isAssigneeAgent = false;

    if (ticket.workspace?.members !== undefined) {
      const requesterRole = ticket.workspace.members.find(m => m.userId === requestingUserId)?.role;
      isRequesterAgent = this.checkAgentRole(requesterRole);
      if (assigneeId) {
        const assigneeRole = ticket.workspace.members.find(m => m.userId === assigneeId)?.role;
        isAssigneeAgent = this.checkAgentRole(assigneeRole);
      }
    } else {
      isRequesterAgent = await this.checkWorkspaceAgentAccess(ticket.workspaceId, requestingUserId);
      if (assigneeId) {
        isAssigneeAgent = await this.checkWorkspaceAgentAccess(ticket.workspaceId, assigneeId);
      }
    }

    if (!isRequesterAgent) {
      throw new ForbiddenException('You do not have access to assign tickets in this workspace');
    }

    if (assigneeId && !isAssigneeAgent) {
      throw new BadRequestException('User is not an authorized agent in this workspace');
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

import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { prisma } from '@repo/database';
import { AblyChannels, AblyEvents, getAblyRest } from '@repo/shared/server';

@Injectable()
export class SupportService {
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

  async endLiveChat(sessionId: string) {
    return prisma.liveChatSession.update({
      where: { id: sessionId },
      data: {
        status: 'ENDED',
        endedAt: new Date(),
      },
    });
  }

  async updateTicketStatus(ticketId: string, status: string) {
    const ticket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status },
      include: { channel: true },
    });

    if (status === 'RESOLVED' || status === 'CLOSED') {
      const ably = getAblyRest();
      if (ably && ticket.channelId) {
        const channel = ably.channels.get(AblyChannels.channel(ticket.channelId));
        await channel.publish(AblyEvents.MESSAGE_SENT, {
          content: `This ticket has been marked as ${status.toLowerCase()}.`,
          messageType: 'system_notification',
          timestamp: new Date(),
        });
      }
    }

    return ticket;
  }

  async assignTicket(ticketId: string, assigneeId: string | null) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
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

  async createCustomerProfile(workspaceId: string, userId: string, data: any) {
    return prisma.customerProfile.upsert({
      where: { userId },
      update: {
        workspaceId,
        company: data.company,
        jobTitle: data.jobTitle,
        crmId: data.crmId,
        metadata: data.metadata,
        tags: data.tags,
      },
      create: {
        userId,
        workspaceId,
        company: data.company,
        jobTitle: data.jobTitle,
        crmId: data.crmId,
        metadata: data.metadata,
        tags: data.tags,
      },
    });
  }

  async getCustomerProfiles(workspaceId: string) {
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

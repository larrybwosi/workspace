import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { prisma } from '@repo/database';
import { AblyChannels, AblyEvents, getAblyRest } from '@repo/shared/server';

@Injectable()
export class SupportService {
  async createTicket(workspaceId: string, customerUserId: string, subject: string, initialMessage?: string) {
    const customerProfile = await prisma.customerProfile.findUnique({
      where: { userId: customerUserId },
    });

    if (!customerProfile) {
      throw new BadRequestException('Customer profile not found');
    }

    // Create a dedicated channel for this ticket
    const channel = await prisma.channel.create({
      data: {
        name: `ticket-${Math.random().toString(36).substring(7)}`,
        icon: '🎫',
        type: 'support_ticket',
        workspaceId,
        isPrivate: true,
        members: {
          create: {
            userId: customerUserId,
            role: 'member',
          },
        },
      },
    });

    const ticket = await prisma.supportTicket.create({
      data: {
        workspaceId,
        customerId: customerProfile.id,
        subject,
        channelId: channel.id,
        status: 'OPEN',
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

    if (initialMessage) {
      await prisma.message.create({
        data: {
          channelId: channel.id,
          userId: customerUserId,
          content: initialMessage,
          messageType: 'support_request',
        },
      });
    }

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
          channel: true,
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
        members: customerUserId
          ? { create: { userId: customerUserId, role: 'member' } }
          : undefined,
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

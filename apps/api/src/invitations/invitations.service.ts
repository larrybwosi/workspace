import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma, User } from '@repo/database';
import { NotificationsService } from '../notifications/notifications.service';
import * as crypto from 'crypto';

@Injectable()
export class InvitationsService {
  constructor(private readonly notificationsService: NotificationsService) {}

  async getInvitations(userId: string, workspaceId?: string) {
    if (workspaceId) {
      // Check if user is admin or owner
      const member = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId,
          },
        },
      });

      if (!member || !['owner', 'admin'].includes(member.role)) {
        throw new ForbiddenException('You do not have permission to view invitations for this workspace');
      }

      return prisma.workspaceInvitation.findMany({
        where: { workspaceId },
        include: {
          inviter: { select: { id: true, name: true, email: true, avatar: true } },
          user: { select: { id: true, name: true, email: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Fetch platform-wide invitations sent by the user
      return prisma.invitation.findMany({
        where: { invitedBy: userId },
        include: {
          inviter: { select: { id: true, name: true, email: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }
  }

  async createInvitation(
    user: User,
    data: {
      email: string;
      role?: string;
      workspaceId?: string;
      channelId?: string;
      permissions?: any;
    },
  ) {
    const token = `inv_${crypto.randomBytes(16).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    let invitation;
    if (data.workspaceId) {
      // Check if user has permission to invite to workspace
      const member = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: data.workspaceId,
            userId: user.id,
          },
        },
      });

      if (!member || !['owner', 'admin'].includes(member.role)) {
        throw new ForbiddenException('You do not have permission to invite users to this workspace');
      }

      invitation = await prisma.workspaceInvitation.create({
        data: {
          workspaceId: data.workspaceId,
          email: data.email,
          token,
          role: data.role || 'member',
          invitedBy: user.id,
          permissions: data.permissions,
          expiresAt,
        },
        include: { workspace: true },
      });
    } else {
      invitation = await prisma.invitation.create({
        data: {
          email: data.email,
          token,
          role: data.role || 'member',
          invitedBy: user.id,
          channelId: data.channelId,
          permissions: data.permissions,
          expiresAt,
        },
      });
    }

    // Check if user already exists
    const invitedUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (invitedUser) {
      await this.notificationsService.createNotification({
        userId: invitedUser.id,
        type: data.workspaceId ? 'workspace_invitation' : 'platform_invitation',
        title: 'Invitation Received',
        message: `${user.name} invited you to join ${invitation.workspace?.name || 'Dealio'}`,
        entityType: 'invitation',
        entityId: invitation.id,
        metadata: {
          workspaceId: data.workspaceId,
          invitationId: invitation.id,
        },
      });
    }

    return invitation;
  }

  async getInvitationByToken(token: string) {
    // 1. Check WorkspaceInviteLink (public link)
    const inviteLink = await prisma.workspaceInviteLink.findUnique({
      where: { code: token },
      include: {
        workspace: {
          include: {
            owner: { select: { name: true, avatar: true } },
          },
        },
      },
    });

    if (inviteLink) {
      return {
        type: 'public_link',
        invitation: {
          ...inviteLink,
          inviter: inviteLink.workspace.owner,
        },
      };
    }

    // 2. Check WorkspaceInvitation (email-specific)
    const workspaceInvite = await prisma.workspaceInvitation.findUnique({
      where: { token },
      include: {
        workspace: true,
        inviter: { select: { name: true, avatar: true } },
      },
    });

    if (workspaceInvite) {
      return {
        type: 'workspace_invitation',
        invitation: workspaceInvite,
      };
    }

    // 3. Check General Invitation (platform)
    const generalInvite = await prisma.invitation.findUnique({
      where: { token },
      include: {
        inviter: { select: { name: true, avatar: true } },
      },
    });

    if (generalInvite) {
      return {
        type: 'platform_invitation',
        invitation: generalInvite,
      };
    }

    throw new NotFoundException('Invitation not found');
  }

  async acceptInvitation(user: User, token: string) {
    // 1. Check WorkspaceInviteLink (public link)
    const inviteLink = await prisma.workspaceInviteLink.findUnique({
      where: { code: token },
      include: { workspace: true },
    });

    if (inviteLink) {
      if (inviteLink.expiresAt && inviteLink.expiresAt < new Date()) {
        throw new BadRequestException('Invite link has expired');
      }
      if (inviteLink.maxUses && inviteLink.maxUses > 0 && inviteLink.uses >= inviteLink.maxUses) {
        throw new BadRequestException('Invite link has reached its use limit');
      }

      // Check if already a member
      const existingMember = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: inviteLink.workspaceId,
            userId: user.id,
          },
        },
      });

      if (existingMember) {
        throw new BadRequestException('Already a member');
      }

      await prisma.$transaction([
        prisma.workspaceMember.create({
          data: {
            workspaceId: inviteLink.workspaceId,
            userId: user.id,
            role: 'member',
          },
        }),
        prisma.workspaceInviteLink.update({
          where: { id: inviteLink.id },
          data: { uses: { increment: 1 } },
        }),
      ]);

      return { success: true, workspace: inviteLink.workspace };
    }

    // 2. Check WorkspaceInvitation (email-specific)
    const workspaceInvite = await prisma.workspaceInvitation.findUnique({
      where: { token },
      include: { workspace: true },
    });

    if (workspaceInvite) {
      if (workspaceInvite.expiresAt && workspaceInvite.expiresAt < new Date()) {
        throw new BadRequestException('Invitation has expired');
      }
      if (workspaceInvite.status !== 'pending') {
        throw new BadRequestException('Invitation is no longer pending');
      }

      // Check if already a member
      const existingMember = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: workspaceInvite.workspaceId,
            userId: user.id,
          },
        },
      });

      if (existingMember) {
        throw new BadRequestException('Already a member');
      }

      await prisma.$transaction([
        prisma.workspaceMember.create({
          data: {
            workspaceId: workspaceInvite.workspaceId,
            userId: user.id,
            role: workspaceInvite.role,
          },
        }),
        prisma.workspaceInvitation.update({
          where: { id: workspaceInvite.id },
          data: { status: 'accepted', acceptedAt: new Date() },
        }),
      ]);

      return { success: true, workspace: workspaceInvite.workspace };
    }

    // 3. Check General Invitation (platform)
    const generalInvite = await prisma.invitation.findUnique({
      where: { token },
    });

    if (generalInvite) {
      if (generalInvite.expiresAt && generalInvite.expiresAt < new Date()) {
        throw new BadRequestException('Invitation has expired');
      }
      if (generalInvite.status !== 'pending') {
        throw new BadRequestException('Invitation is no longer pending');
      }

      // Automatically add as friends
      await prisma.$transaction([
        prisma.friend.upsert({
          where: { userId_friendId: { userId: generalInvite.invitedBy, friendId: user.id } },
          update: {},
          create: { userId: generalInvite.invitedBy, friendId: user.id },
        }),
        prisma.friend.upsert({
          where: { userId_friendId: { userId: user.id, friendId: generalInvite.invitedBy } },
          update: {},
          create: { userId: user.id, friendId: generalInvite.invitedBy },
        }),
        prisma.invitation.update({
          where: { id: generalInvite.id },
          data: { status: 'accepted', acceptedAt: new Date() },
        }),
      ]);

      return { success: true, platform: true };
    }

    throw new NotFoundException('Invalid invitation token');
  }
}

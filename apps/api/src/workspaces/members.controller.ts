import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { prisma } from '@repo/database';
import type { User } from '@repo/database';
import { z } from 'zod';
import { publishToAbly, AblyChannels } from '@repo/shared';

const updateMemberSchema = z.object({
  role: z.enum(['owner', 'admin', 'member', 'guest']),
});

@Controller('workspaces/:slug/members')
@UseGuards(AuthGuard)
export class MembersController {
  @Get()
  async getWorkspaceMembers(@CurrentUser() user: User, @Param('slug') slug: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspace.id,
          userId: user.id,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('Access denied');
    }

    const members = await prisma.workspaceMember.findMany({
      where: {
        workspaceId: workspace.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            image: true,
            status: true,
          },
        },
      },
    });

    return { members };
  }

  @Patch(':memberId')
  async updateMember(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('memberId') memberId: string,
    @Body() body: any
  ) {
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const requesterMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspace.id,
          userId: user.id,
        },
      },
    });

    if (!requesterMember || !['owner', 'admin'].includes(requesterMember.role)) {
      throw new ForbiddenException('Access denied');
    }

    const validatedData = updateMemberSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }
    const { role } = validatedData.data;

    const updatedMember = await prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role },
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

    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        action: 'member.role_changed',
        resource: 'member',
        resourceId: memberId,
        metadata: { newRole: role },
      },
    });

    await publishToAbly(AblyChannels.user(updatedMember.userId), 'NOTIFICATION', {
      type: 'workspace.role_changed',
      workspaceId: workspace.id,
      newRole: role,
    });

    return updatedMember;
  }

  @Delete(':memberId')
  async removeMember(@CurrentUser() user: User, @Param('slug') slug: string, @Param('memberId') memberId: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const requesterMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspace.id,
          userId: user.id,
        },
      },
    });

    if (!requesterMember || !['owner', 'admin'].includes(requesterMember.role)) {
      throw new ForbiddenException('Access denied');
    }

    const memberToRemove = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!memberToRemove) {
      throw new NotFoundException('Member not found');
    }

    if (memberToRemove.role === 'owner') {
      throw new BadRequestException('Cannot remove workspace owner');
    }

    await prisma.workspaceMember.delete({
      where: { id: memberId },
    });

    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        action: 'member.removed',
        resource: 'member',
        resourceId: memberId,
      },
    });

    await publishToAbly(AblyChannels.user(memberToRemove.userId), 'NOTIFICATION', {
      type: 'workspace.removed',
      workspaceId: workspace.id,
    });

    return { success: true };
  }
}

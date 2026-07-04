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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiProperty } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { prisma } from '@repo/database';
import type { User } from '@repo/database';
import { z } from 'zod';
import { publishRealtime, AblyChannels } from '@repo/shared/server';
import { IsEnum } from 'class-validator';

class UpdateMemberRoleDto {
  @IsEnum(['owner', 'admin', 'member', 'guest'])
  @ApiProperty({ enum: ['owner', 'admin', 'member', 'guest'], example: 'admin' })
  role: 'owner' | 'admin' | 'member' | 'guest';
}

const updateMemberSchema = z.object({
  role: z.enum(['owner', 'admin', 'member', 'guest']),
});

@ApiTags('Members')
@ApiBearerAuth()
@Controller('workspaces/:slug/members')
@UseGuards(AuthGuard)
export class MembersController {
  @Get()
  @ApiOperation({ summary: 'Get all members of a workspace' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiResponse({ status: 200, description: 'List of members' })
  async getWorkspaceMembers(@CurrentUser() user: User, @Param('slug') slug: string) {
    /**
     * ⚡ Performance Optimization:
     * 1. Consolidates workspace lookup, membership verification, and retrieval of all members into a single query.
     * 2. Fetches current user's membership for access control and all workspace members in one round-trip.
     * 3. Uses nested 'select' for users to retrieve only essential profile fields.
     * Expected impact: Reduces database round-trips from 2 down to 1.
     */
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      select: {
        id: true,
        members: {
          // Fetch all members for the response
          select: {
            id: true,
            workspaceId: true,
            userId: true,
            departmentId: true,
            role: true,
            joinedAt: true,
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
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Verify current user's membership for access control
    const requesterMember = workspace.members.find(m => m.userId === user.id);

    if (!requesterMember) {
      throw new ForbiddenException('Access denied');
    }

    return { members: workspace.members };
  }

  @Patch(':memberId')
  @ApiOperation({ summary: 'Update a workspace member (e.g. change role)' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'memberId', description: 'The member ID' })
  @ApiBody({ type: UpdateMemberRoleDto })
  @ApiResponse({ status: 200, description: 'Member updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Only owner or admin can update' })
  async updateMember(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('memberId') memberId: string,
    @Body() body: UpdateMemberRoleDto
  ) {
    /**
     * ⚡ Performance Optimization:
     * 1. Consolidates workspace lookup, requester authorization, and target member verification into a single database query.
     * 2. Backgrounds non-critical side effects (audit logging, realtime notifications) to minimize response latency.
     * 3. Fixes security flaw by ensuring the target member belongs to the specified workspace.
     * Expected impact: Reduces database round-trips from 3 down to 2 and significantly improves response time.
     */
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      select: {
        id: true,
        members: {
          where: {
            OR: [{ userId: user.id }, { id: memberId }],
          },
          select: { id: true, userId: true, role: true },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const requesterMember = workspace.members.find(m => m.userId === user.id);
    const targetMember = workspace.members.find(m => m.id === memberId);

    if (!requesterMember || !['owner', 'admin'].includes(requesterMember.role)) {
      throw new ForbiddenException('Access denied');
    }

    if (!targetMember) {
      throw new NotFoundException('Member not found in this workspace');
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

    // Background side effects to minimize response time
    prisma.workspaceAuditLog
      .create({
        data: {
          workspaceId: workspace.id,
          userId: user.id,
          action: 'member.role_changed',
          resource: 'member',
          resourceId: memberId,
          metadata: { newRole: role },
        },
      })
      .catch(err => console.error('Audit log error:', err));

    publishRealtime(AblyChannels.user(updatedMember.userId), 'NOTIFICATION', {
      type: 'workspace.role_changed',
      workspaceId: workspace.id,
      newRole: role,
    }).catch(err => console.error('Realtime notification error:', err));

    return updatedMember;
  }

  @Delete(':memberId')
  @ApiOperation({ summary: 'Remove a member from a workspace' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'memberId', description: 'The member ID' })
  @ApiResponse({ status: 200, description: 'Member removed successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Only owner or admin can remove' })
  async removeMember(@CurrentUser() user: User, @Param('slug') slug: string, @Param('memberId') memberId: string) {
    /**
     * ⚡ Performance Optimization:
     * 1. Consolidates workspace lookup, requester authorization, and target member verification into a single database query.
     * 2. Backgrounds non-critical side effects (audit logging, realtime notifications) to minimize response latency.
     * 3. Fixes security flaw by ensuring the target member belongs to the specified workspace.
     * Expected impact: Reduces database round-trips from 3 down to 2 and significantly improves response time.
     */
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      select: {
        id: true,
        members: {
          where: {
            OR: [{ userId: user.id }, { id: memberId }],
          },
          select: { id: true, userId: true, role: true },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const requesterMember = workspace.members.find(m => m.userId === user.id);
    const memberToRemove = workspace.members.find(m => m.id === memberId);

    if (!requesterMember || !['owner', 'admin'].includes(requesterMember.role)) {
      throw new ForbiddenException('Access denied');
    }

    if (!memberToRemove) {
      throw new NotFoundException('Member not found in this workspace');
    }

    if (memberToRemove.role === 'owner') {
      throw new BadRequestException('Cannot remove workspace owner');
    }

    await prisma.workspaceMember.delete({
      where: { id: memberId },
    });

    // Background side effects to minimize response time
    prisma.workspaceAuditLog
      .create({
        data: {
          workspaceId: workspace.id,
          userId: user.id,
          action: 'member.removed',
          resource: 'member',
          resourceId: memberId,
        },
      })
      .catch(err => console.error('Audit log error:', err));

    publishRealtime(AblyChannels.user(memberToRemove.userId), 'NOTIFICATION', {
      type: 'workspace.removed',
      workspaceId: workspace.id,
    }).catch(err => console.error('Realtime notification error:', err));

    return { success: true };
  }
}

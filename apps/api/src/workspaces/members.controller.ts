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

class UpdateMemberRoleDto {
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
     * 2. Uses 'findFirst' with a nested relation filter to ensure the requester is a member at the database level.
     * 3. Replaces 'include' with targeted 'select' to exclude 'permissions' (BigInt) and redundant fields.
     * 4. Eliminates O(N) in-memory membership verification.
     * Expected impact: Prevents fetching massive member lists for unauthorized requests and reduces JSON payload size.
     */
    const workspace = await prisma.workspace.findFirst({
      where: {
        slug,
        members: {
          some: { userId: user.id },
        },
      },
      select: {
        id: true,
        members: {
          select: {
            id: true,
            workspaceId: true,
            userId: true,
            departmentId: true,
            role: true,
            memberType: true,
            joinedAt: true,
            notificationPreference: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!workspace) {
      /**
       * If workspace is null, it either doesn't exist or the user is not a member.
       * We perform a simple check to distinguish between the two for better API feedback.
       */
      const exists = await prisma.workspace.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (!exists) {
        throw new NotFoundException('Workspace not found');
      }
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
     * 1. Combines workspace lookup and membership verification into a single database query.
     * 2. Uses 'select' instead of 'include' to retrieve only the workspace ID and membership status.
     * 3. Reduces database payload and memory usage for initial verification.
     */
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      select: {
        id: true,
        members: {
          where: { userId: user.id },
          select: { role: true },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const requesterMember = workspace.members[0];

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

    prisma.workspaceAuditLog.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        action: 'member.role_changed',
        resource: 'member',
        resourceId: memberId,
        metadata: { newRole: role },
      },
    }).catch(err => console.error('Audit log error:', err));

    publishRealtime(AblyChannels.user(updatedMember.userId), 'NOTIFICATION', {
      type: 'workspace.role_changed',
      workspaceId: workspace.id,
      newRole: role,
    }).catch(err => console.error('Realtime publishing error:', err));

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
     * 1. Consolidates workspace lookup, membership verification, and target member retrieval into a single query.
     * 2. Uses nested 'select' with filtered relations to fetch requester and target member in one RTT.
     * 3. Reduces database round-trips from 3 down to 1.
     */
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      select: {
        id: true,
        members: {
          where: {
            OR: [
              { userId: user.id },
              { id: memberId }
            ]
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
      throw new NotFoundException('Member not found');
    }

    if (memberToRemove.role === 'owner') {
      throw new BadRequestException('Cannot remove workspace owner');
    }

    await prisma.workspaceMember.delete({
      where: { id: memberId },
    });

    prisma.workspaceAuditLog.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        action: 'member.removed',
        resource: 'member',
        resourceId: memberId,
      },
    }).catch(err => console.error('Audit log error:', err));

    publishRealtime(AblyChannels.user(memberToRemove.userId), 'NOTIFICATION', {
      type: 'workspace.removed',
      workspaceId: workspace.id,
    }).catch(err => console.error('Realtime publishing error:', err));

    return { success: true };
  }
}

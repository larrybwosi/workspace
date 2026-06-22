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

    await publishRealtime(AblyChannels.user(updatedMember.userId), 'NOTIFICATION', {
      type: 'workspace.role_changed',
      workspaceId: workspace.id,
      newRole: role,
    });

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

    await publishRealtime(AblyChannels.user(memberToRemove.userId), 'NOTIFICATION', {
      type: 'workspace.removed',
      workspaceId: workspace.id,
    });

    return { success: true };
  }
}

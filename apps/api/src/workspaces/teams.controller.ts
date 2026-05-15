import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiProperty,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { prisma } from '@repo/database';
import type { User } from '@repo/database';
import { z } from 'zod';
import { getAblyServer, AblyChannels, EVENTS } from '@repo/shared/server';
import { TeamSyncService } from './team-sync.service';

class CreateWorkspaceTeamDto {
  @ApiProperty({ example: 'Engineering' })
  name: string;

  @ApiProperty({ example: 'engineering' })
  slug: string;

  @ApiProperty({ required: false, example: 'Our engineering team' })
  description?: string;

  @ApiProperty({ required: false, example: 'Users' })
  icon?: string;

  @ApiProperty({ required: false, example: '#3b82f6' })
  color?: string;

  @ApiProperty({ required: false, example: 'dept_123' })
  departmentId?: string;

  @ApiProperty({ required: false, example: 'user_123' })
  leadId?: string;

  @ApiProperty({ required: false, type: [String], example: ['user_123', 'user_456'] })
  memberIds?: string[];

  @ApiProperty({ required: false, default: true })
  createChannel?: boolean;
}

class AddTeamMemberDto {
  @ApiProperty({ example: 'user_123' })
  userId: string;

  @ApiProperty({ required: false, example: 'member' })
  role?: string;
}

const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  departmentId: z.string().optional(),
  leadId: z.string().optional(),
  memberIds: z.array(z.string()).optional(),
  createChannel: z.boolean().optional().default(true),
});

@ApiTags('Teams')
@ApiBearerAuth()
@Controller('workspaces/:slug/teams')
@UseGuards(AuthGuard)
export class TeamsController {
  constructor(private readonly teamSyncService: TeamSyncService) {}

  @Get()
  @ApiOperation({ summary: 'Get all teams in a workspace' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiQuery({ name: 'departmentId', required: false, description: 'Filter teams by department' })
  @ApiResponse({ status: 200, description: 'List of teams' })
  async getTeams(@CurrentUser() user: User, @Param('slug') slug: string, @Query('departmentId') departmentId: string) {
    /**
     * ⚡ Performance Optimization:
     * 1. Consolidates workspace lookup, membership verification, and team retrieval into a single database query.
     * 2. Uses nested 'select' and filtered relations to reduce database round-trips from 2 down to 1.
     * 3. Efficiently handles optional department filtering within the same query.
     * Expected impact: Reduces database round-trips and improves API throughput for team listings.
     */
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      select: {
        id: true,
        members: {
          where: { userId: user.id },
          select: { role: true },
        },
        teams: {
          where: departmentId ? { departmentId } : {},
          select: {
            id: true,
            workspaceId: true,
            departmentId: true,
            name: true,
            slug: true,
            description: true,
            icon: true,
            color: true,
            leadId: true,
            channelId: true,
            createdAt: true,
            updatedAt: true,
            department: { select: { id: true, name: true, icon: true, color: true } },
            members: {
              select: {
                id: true,
                teamId: true,
                userId: true,
                role: true,
                joinedAt: true,
                user: { select: { id: true, name: true, email: true, avatar: true, status: true } },
              },
            },
            _count: { select: { members: true } },
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const member = workspace.members[0];

    if (!member) {
      throw new ForbiddenException('Forbidden');
    }

    return { teams: workspace.teams };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new team' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiBody({ type: CreateWorkspaceTeamDto })
  @ApiResponse({ status: 201, description: 'Team created successfully' })
  async createTeam(@CurrentUser() user: User, @Param('slug') slug: string, @Body() body: CreateWorkspaceTeamDto) {
    /**
     * ⚡ Performance Optimization:
     * Consolidates workspace lookup and membership verification into a single database query.
     * Reduces database round-trips from 2 down to 1.
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

    const member = workspace.members[0];

    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new ForbiddenException('Forbidden');
    }

    const validatedData = createTeamSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }
    const data = validatedData.data;

    const existing = await prisma.workspaceTeam.findUnique({
      where: { workspaceId_slug: { workspaceId: workspace.id, slug: data.slug } },
    });

    if (existing) {
      throw new BadRequestException('Team slug already exists');
    }

    let channelId: string | undefined;
    if (data.createChannel) {
      const channel = await prisma.channel.create({
        data: {
          name: `team-${data.slug}`,
          description: `${data.name} team channel`,
          type: 'private',
          icon: data.icon || 'users',
          workspaceId: workspace.id,
          createdById: user.id,
        },
      });
      channelId = channel.id;
    }

    const team = await prisma.workspaceTeam.create({
      data: {
        workspaceId: workspace.id,
        name: data.name,
        slug: data.slug,
        description: data.description,
        icon: data.icon,
        color: data.color,
        departmentId: data.departmentId,
        leadId: data.leadId,
        channelId,
      },
      include: {
        department: true,
        members: { include: { user: true } },
      },
    });

    if (data.memberIds && data.memberIds.length > 0) {
      await prisma.workspaceTeamMember.createMany({
        data: data.memberIds.map(userId => ({
          teamId: team.id,
          userId,
          role: userId === data.leadId ? 'lead' : 'member',
        })),
      });

      // Sync members to channel if it exists
      if (channelId) {
        await prisma.channelMember.createMany({
          data: data.memberIds.map(userId => ({
            channelId: channelId!,
            userId,
            role: 'member',
          })),
          skipDuplicates: true,
        });
      }
    }

    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        action: 'team.created',
        resource: 'team',
        resourceId: team.id,
        metadata: { name: data.name, memberCount: data.memberIds?.length || 0 },
      },
    });

    const ably = getAblyServer();
    if (ably) {
      const channel = ably.channels.get(AblyChannels.workspace(workspace.id));
      await channel.publish(EVENTS.WORKSPACE_UPDATED, {
        type: 'team_created',
        team,
      });
    }

    return team;
  }

  @Post(':teamId/members')
  @ApiOperation({ summary: 'Add a member to a team' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'teamId', description: 'The team ID' })
  @ApiBody({ type: AddTeamMemberDto })
  @ApiResponse({ status: 201, description: 'Member added to team' })
  async addMember(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('teamId') teamId: string,
    @Body() body: AddTeamMemberDto
  ) {
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

    const member = workspace.members[0];

    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new ForbiddenException('Forbidden');
    }

    const teamMember = await prisma.workspaceTeamMember.create({
      data: {
        teamId,
        userId: body.userId,
        role: body.role || 'member',
      },
    });

    await this.teamSyncService.syncTeamMemberToChannel(teamId, body.userId, 'add');

    return teamMember;
  }

  @Delete(':teamId/members/:userId')
  @ApiOperation({ summary: 'Remove a member from a team' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'teamId', description: 'The team ID' })
  @ApiParam({ name: 'userId', description: 'The user ID' })
  @ApiResponse({ status: 200, description: 'Member removed from team' })
  async removeMember(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('teamId') teamId: string,
    @Param('userId') userId: string
  ) {
    /**
     * ⚡ Performance Optimization:
     * Consolidates workspace lookup and membership verification into a single database query.
     * Reduces database round-trips from 2 down to 1.
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

    const member = workspace.members[0];

    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new ForbiddenException('Forbidden');
    }

    await prisma.workspaceTeamMember.delete({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    await this.teamSyncService.syncTeamMemberToChannel(teamId, userId, 'remove');

    return { success: true };
  }
}

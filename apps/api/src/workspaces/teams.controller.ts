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
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { prisma } from '@repo/database';
import type { User } from '@repo/database';
import { z } from 'zod';
import { getAblyServer, AblyChannels, EVENTS } from '@repo/shared';

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

@Controller('workspaces/:slug/teams')
@UseGuards(AuthGuard)
export class TeamsController {
  @Get()
  async getTeams(@CurrentUser() user: User, @Param('slug') slug: string, @Query('departmentId') departmentId: string) {
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
      throw new ForbiddenException('Forbidden');
    }

    const where: any = { workspaceId: workspace.id };
    if (departmentId) {
      where.departmentId = departmentId;
    }

    const teams = await prisma.workspaceTeam.findMany({
      where,
      include: {
        department: { select: { id: true, name: true, icon: true, color: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true, status: true } },
          },
        },
        _count: { select: { members: true } },
      },
      orderBy: { name: 'asc' },
    });

    return { teams };
  }

  @Post()
  async createTeam(@CurrentUser() user: User, @Param('slug') slug: string, @Body() body: any) {
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
}

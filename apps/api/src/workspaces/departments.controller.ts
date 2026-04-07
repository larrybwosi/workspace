import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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

const createDepartmentSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  parentId: z.string().optional(),
  managerId: z.string().optional(),
  settings: z.any().optional(),
  createChannel: z.boolean().optional().default(true),
});

const updateDepartmentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  parentId: z.string().nullable().optional(),
  managerId: z.string().nullable().optional(),
  settings: z.any().optional(),
});

const createAnnouncementSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional().default('normal'),
  pinned: z.boolean().optional().default(false),
  publishAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  targetAudience: z
    .object({
      departments: z.array(z.string()).optional(),
      teams: z.array(z.string()).optional(),
      roles: z.array(z.string()).optional(),
    })
    .optional(),
  attachments: z.array(z.any()).optional(),
});

@Controller('workspaces/:slug/departments')
@UseGuards(AuthGuard)
export class DepartmentsController {
  @Get()
  async getDepartments(@CurrentUser() user: User, @Param('slug') slug: string) {
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

    const departments = await prisma.workspaceDepartment.findMany({
      where: { workspaceId: workspace.id },
      include: {
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true, icon: true, color: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
        teams: { select: { id: true, name: true, icon: true, color: true } },
        _count: { select: { members: true, teams: true, announcements: true } },
      },
      orderBy: { name: 'asc' },
    });

    return departments;
  }

  @Post()
  async createDepartment(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Body() body: any,
  ) {
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

    const validatedData = createDepartmentSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }
    const data = validatedData.data;

    const existing = await prisma.workspaceDepartment.findUnique({
      where: { workspaceId_slug: { workspaceId: workspace.id, slug: data.slug } },
    });

    if (existing) {
      throw new BadRequestException('Department slug already exists');
    }

    let channelId: string | undefined;
    if (data.createChannel) {
      const channel = await prisma.channel.create({
        data: {
          name: `dept-${data.slug}`,
          description: `${data.name} department channel`,
          type: 'public',
          icon: data.icon || 'building-2',
          workspaceId: workspace.id,
          createdById: user.id,
        },
      });
      channelId = channel.id;
    }

    const department = await prisma.workspaceDepartment.create({
      data: {
        workspaceId: workspace.id,
        name: data.name,
        slug: data.slug,
        description: data.description,
        icon: data.icon,
        color: data.color,
        parentId: data.parentId,
        managerId: data.managerId,
        settings: data.settings as any,
        channelId,
      },
      include: {
        parent: true,
        members: { include: { user: true } },
        teams: true,
      },
    });

    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        action: 'department.created',
        resource: 'department',
        resourceId: department.id,
        metadata: { name: data.name, slug: data.slug },
      },
    });

    const ably = getAblyServer();
    if (ably) {
      const channel = ably.channels.get(AblyChannels.workspace(workspace.id));
      await channel.publish(EVENTS.WORKSPACE_UPDATED, {
        type: 'department_created',
        department,
        userId: user.id,
      });
    }

    return department;
  }

  @Get(':departmentId')
  async getDepartment(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('departmentId') departmentId: string,
  ) {
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

    const department = await prisma.workspaceDepartment.findUnique({
      where: { id: departmentId },
      include: {
        parent: true,
        children: true,
        members: {
          include: {
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
        teams: {
          include: {
            members: {
              include: {
                user: { select: { id: true, name: true, avatar: true } },
              },
            },
            _count: { select: { members: true } },
          },
        },
        announcements: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            author: { select: { id: true, name: true, avatar: true } },
          },
        },
        _count: { select: { members: true, teams: true, announcements: true } },
      },
    });

    if (!department || department.workspaceId !== workspace.id) {
      throw new NotFoundException('Department not found');
    }

    return department;
  }

  @Patch(':departmentId')
  async updateDepartment(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('departmentId') departmentId: string,
    @Body() body: any,
  ) {
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

    const validatedData = updateDepartmentSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }
    const data = validatedData.data;

    const department = await prisma.workspaceDepartment.update({
      where: { id: departmentId },
      data: {
        name: data.name,
        description: data.description,
        icon: data.icon,
        color: data.color,
        parentId: data.parentId,
        managerId: data.managerId,
        settings: data.settings as any,
      },
      include: { parent: true, members: { include: { user: true } }, teams: true },
    });

    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        action: 'department.updated',
        resource: 'department',
        resourceId: departmentId,
        metadata: data as any,
      },
    });

    return department;
  }

  @Delete(':departmentId')
  async deleteDepartment(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('departmentId') departmentId: string,
  ) {
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

    await prisma.workspaceDepartment.delete({ where: { id: departmentId } });

    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        action: 'department.deleted',
        resource: 'department',
        resourceId: departmentId,
      },
    });

    return { success: true };
  }

  @Get(':departmentId/announcements')
  async getAnnouncements(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('departmentId') departmentId: string,
    @Query('page') pageNum = '1',
    @Query('limit') limitNum = '20',
    @Query('priority') priority: string,
  ) {
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

    const page = parseInt(pageNum);
    const limit = parseInt(limitNum);

    const where: any = {
      departmentId,
      OR: [{ publishAt: null }, { publishAt: { lte: new Date() } }],
      AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }],
    };

    if (priority) {
      where.priority = priority;
    }

    const [announcements, total] = await Promise.all([
      prisma.departmentAnnouncement.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.departmentAnnouncement.count({ where }),
    ]);

    return {
      announcements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @Post(':departmentId/announcements')
  async createAnnouncement(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('departmentId') departmentId: string,
    @Body() body: any,
  ) {
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

    const department = await prisma.workspaceDepartment.findUnique({
      where: { id: departmentId },
    });

    const isManager = department?.managerId === user.id;
    const isAdmin = member && ['owner', 'admin'].includes(member.role);

    if (!isManager && !isAdmin) {
      throw new ForbiddenException('Forbidden');
    }

    const validatedData = createAnnouncementSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }
    const data = validatedData.data;

    const announcement = await prisma.departmentAnnouncement.create({
      data: {
        departmentId,
        authorId: user.id,
        title: data.title,
        content: data.content,
        priority: data.priority,
        pinned: data.pinned,
        publishAt: data.publishAt ? new Date(data.publishAt) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        targetAudience: data.targetAudience as any,
        attachments: data.attachments as any,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    });

    const ably = getAblyServer();
    if (ably) {
      const channel = ably.channels.get(AblyChannels.workspace(workspace.id));
      await channel.publish(EVENTS.WORKSPACE_UPDATED, {
        type: 'announcement_created',
        announcement,
        departmentId,
      });
    }

    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        action: 'announcement.created',
        resource: 'announcement',
        resourceId: announcement.id,
        metadata: { title: data.title, priority: data.priority },
      },
    });

    return announcement;
  }
}

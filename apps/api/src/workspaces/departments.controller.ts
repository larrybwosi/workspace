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

class CreateWorkspaceDepartmentDto {
  @ApiProperty({ example: 'Human Resources' })
  name: string;

  @ApiProperty({ example: 'hr' })
  slug: string;

  @ApiProperty({ required: false, example: 'HR department' })
  description?: string;

  @ApiProperty({ required: false, example: 'Building' })
  icon?: string;

  @ApiProperty({ required: false, example: '#f43f5e' })
  color?: string;

  @ApiProperty({ required: false, example: 'dept_123' })
  parentId?: string;

  @ApiProperty({ required: false, example: 'user_123' })
  managerId?: string;

  @ApiProperty({ required: false })
  settings?: any;

  @ApiProperty({ required: false, default: true })
  createChannel?: boolean;
}

class UpdateWorkspaceDepartmentDto {
  @ApiProperty({ required: false, example: 'New Name' })
  name?: string;

  @ApiProperty({ required: false, example: 'Updated description' })
  description?: string;

  @ApiProperty({ required: false, example: 'Building2' })
  icon?: string;

  @ApiProperty({ required: false, example: '#ef4444' })
  color?: string;

  @ApiProperty({ required: false, nullable: true })
  parentId?: string | null;

  @ApiProperty({ required: false, nullable: true })
  managerId?: string | null;

  @ApiProperty({ required: false })
  settings?: any;
}

class TargetAudienceDto {
  @ApiProperty({ type: [String], required: false })
  departments?: string[];

  @ApiProperty({ type: [String], required: false })
  teams?: string[];

  @ApiProperty({ type: [String], required: false })
  roles?: string[];
}

class CreateDepartmentAnnouncementDto {
  @ApiProperty({ example: 'Office Closed' })
  title: string;

  @ApiProperty({ example: 'The office will be closed tomorrow.' })
  content: string;

  @ApiProperty({ required: false, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' })
  priority?: 'low' | 'normal' | 'high' | 'urgent';

  @ApiProperty({ required: false, default: false })
  pinned?: boolean;

  @ApiProperty({ required: false, description: 'ISO format datetime' })
  publishAt?: string;

  @ApiProperty({ required: false, description: 'ISO format datetime' })
  expiresAt?: string;

  @ApiProperty({ required: false, type: TargetAudienceDto })
  targetAudience?: TargetAudienceDto;

  @ApiProperty({ required: false, type: 'array', items: { type: 'object' } })
  attachments?: any[];
}

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

@ApiTags('Departments')
@ApiBearerAuth()
@Controller('workspaces/:slug/departments')
@UseGuards(AuthGuard)
export class DepartmentsController {
  @Get()
  @ApiOperation({ summary: 'Get all departments in a workspace' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiResponse({ status: 200, description: 'List of departments' })
  async getDepartments(@CurrentUser() user: User, @Param('slug') slug: string) {
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

    if (!member) {
      throw new ForbiddenException('Forbidden');
    }

    const departments = await prisma.workspaceDepartment.findMany({
      where: { workspaceId: workspace.id },
      select: {
        id: true,
        workspaceId: true,
        name: true,
        slug: true,
        description: true,
        icon: true,
        color: true,
        parentId: true,
        managerId: true,
        channelId: true,
        createdAt: true,
        updatedAt: true,
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true, icon: true, color: true } },
        members: {
          select: {
            id: true,
            workspaceId: true,
            userId: true,
            departmentId: true,
            role: true,
            joinedAt: true,
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
  @ApiOperation({ summary: 'Create a new department' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiBody({ type: CreateWorkspaceDepartmentDto })
  @ApiResponse({ status: 201, description: 'Department created successfully' })
  async createDepartment(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Body() body: CreateWorkspaceDepartmentDto
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
  @ApiOperation({ summary: 'Get department details' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'departmentId', description: 'The department ID' })
  @ApiResponse({ status: 200, description: 'Department details' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  async getDepartment(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('departmentId') departmentId: string
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
  @ApiOperation({ summary: 'Update department details' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'departmentId', description: 'The department ID' })
  @ApiBody({ type: UpdateWorkspaceDepartmentDto })
  @ApiResponse({ status: 200, description: 'Department updated successfully' })
  async updateDepartment(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('departmentId') departmentId: string,
    @Body() body: UpdateWorkspaceDepartmentDto
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
  @ApiOperation({ summary: 'Delete a department' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'departmentId', description: 'The department ID' })
  @ApiResponse({ status: 200, description: 'Department deleted successfully' })
  async deleteDepartment(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('departmentId') departmentId: string
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
  @ApiOperation({ summary: 'Get announcements for a department' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'departmentId', description: 'The department ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'priority', required: false, enum: ['low', 'normal', 'high', 'urgent'] })
  @ApiResponse({ status: 200, description: 'List of announcements' })
  async getAnnouncements(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('departmentId') departmentId: string,
    @Query('page') pageNum = '1',
    @Query('limit') limitNum = '20',
    @Query('priority') priority: string
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
  @ApiOperation({ summary: 'Create a new announcement in a department' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'departmentId', description: 'The department ID' })
  @ApiBody({ type: CreateDepartmentAnnouncementDto })
  @ApiResponse({ status: 201, description: 'Announcement created successfully' })
  async createAnnouncement(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('departmentId') departmentId: string,
    @Body() body: CreateDepartmentAnnouncementDto
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

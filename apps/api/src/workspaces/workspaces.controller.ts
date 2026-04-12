import {
  Controller,
  Get,
  Post,
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
import { AblyChannels, EVENTS, getAblyRest } from '@repo/shared/server';

const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
  icon: z.string().optional(),
  description: z.string().optional(),
});

const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  icon: z.string().optional(),
  description: z.string().optional(),
  settings: z.any().optional(),
  plan: z.enum(['free', 'pro', 'enterprise']).optional(),
});

const createChannelSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  type: z.enum(['public', 'private']).default('public'),
  departmentId: z.string().optional(),
  icon: z.string().optional(),
});

const updateMemberSchema = z.object({
  role: z.enum(['owner', 'admin', 'member', 'guest']),
});

@Controller('workspaces')
@UseGuards(AuthGuard)
export class WorkspacesController {
  @Get()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getWorkspaces(@CurrentUser() user: User): Promise<any> {
    return prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId: user.id,
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        members: {
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
        },
        _count: {
          select: {
            channels: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createWorkspace(@CurrentUser() user: User, @Body() body: Record<string, unknown>): Promise<any> {
    const validatedData = createWorkspaceSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }

    const existingWorkspace = await prisma.workspace.findUnique({
      where: { slug: validatedData.data.slug },
    });

    if (existingWorkspace) {
      throw new BadRequestException('Workspace slug already taken');
    }

    const { name, slug, icon, description } = validatedData.data;

    return prisma.workspace.create({
      data: {
        name,
        slug,
        icon,
        description,
        owner: {
          connect: { id: user.id },
        },
        members: {
          create: {
            userId: user.id,
            role: 'owner',
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        members: {
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
        },
      },
    });
  }

  @Get(':slug')
  async getWorkspaceBySlug(@CurrentUser() user: User, @Param('slug') slug: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
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
        channels: {
          select: {
            id: true,
            name: true,
            icon: true,
            type: true,
          },
        },
        _count: {
          select: {
            channels: true,
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const isMember = workspace.members.some(m => m.userId === user.id);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    return workspace;
  }

  @Patch(':slug')
  async updateWorkspaceBySlug(@CurrentUser() user: User, @Param('slug') slug: string, @Body() body: any) {
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
      throw new ForbiddenException('You do not have permission to update this workspace');
    }

    const validatedData = updateWorkspaceSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }

    const updatedWorkspace = await prisma.workspace.update({
      where: { id: workspace.id },
      data: validatedData.data,
      include: {
        owner: true,
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        action: 'workspace.updated',
        resource: 'workspace',
        resourceId: workspace.id,
        metadata: validatedData.data as any,
      },
    });

    return updatedWorkspace;
  }

  @Delete(':slug')
  async deleteWorkspaceBySlug(@CurrentUser() user: User, @Param('slug') slug: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (workspace.ownerId !== user.id) {
      throw new ForbiddenException('Only the owner can delete the workspace');
    }

    await prisma.workspace.delete({
      where: { id: workspace.id },
    });

    return { success: true };
  }
}

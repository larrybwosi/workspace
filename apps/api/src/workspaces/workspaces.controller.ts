import { Controller, Get, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { prisma, User } from '@repo/database';
import { z } from 'zod';

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
}

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
import { getAblyServer, AblyChannels, EVENTS } from '@repo/shared';

const createChannelSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  type: z.enum(['public', 'private']).default('public'),
  departmentId: z.string().optional(),
  icon: z.string().optional(),
});

const updateChannelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  type: z.enum(['public', 'private']).optional(),
  icon: z.string().optional(),
});

@Controller('workspaces/:slug/channels')
@UseGuards(AuthGuard)
export class ChannelsController {
  @Get()
  async getWorkspaceChannels(@CurrentUser() user: User, @Param('slug') slug: string) {
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

    const channels = await prisma.channel.findMany({
      where: {
        workspaceId: workspace.id,
        OR: [
          { isPrivate: false },
          {
            isPrivate: true,
            members: {
              some: {
                userId: user.id,
              },
            },
          },
        ],
      },
      include: {
        _count: { select: { messages: true } },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return channels;
  }

  @Post()
  async createChannel(
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

    if (!member || !['owner', 'admin', 'member'].includes(member.role)) {
      throw new ForbiddenException('Forbidden');
    }

    const validatedData = createChannelSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }
    const data = validatedData.data;

    const channelSlug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const channel = await prisma.channel.create({
      data: {
        name: data.name,
        slug: channelSlug,
        description: data.description,
        type: data.type === 'private' ? 'private' : 'public',
        icon: data.icon || '#',
        workspaceId: workspace.id,
        createdById: user.id,
        members: {
          create: { userId: user.id, role: 'admin' },
        },
      },
      include: {
        members: { include: { user: true } },
      },
    });

    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        action: 'channel.created',
        resource: 'channel',
        resourceId: channel.id,
        metadata: { name: data.name, type: data.type },
      },
    });

    const ably = getAblyServer();
    if (ably) {
      const ablyChannel = ably.channels.get(AblyChannels.workspace(workspace.id));
      await ablyChannel.publish(EVENTS.CHANNEL_CREATED, { channel, userId: user.id });
    }

    return channel;
  }

  @Get(':channelId')
  async getChannel(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('channelId') channelId: string,
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

    const channel = await prisma.channel.findUnique({
      where: { id: channelId, workspaceId: workspace.id },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
        _count: { select: { members: true, threads: true } },
      },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    return channel;
  }

  @Patch(':channelId')
  async updateChannel(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('channelId') channelId: string,
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

    const validatedData = updateChannelSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }
    const data = validatedData.data;

    const channel = await prisma.channel.update({
      where: { id: channelId, workspaceId: workspace.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.type && { type: data.type }),
        ...(data.icon && { icon: data.icon }),
      },
      include: { members: { include: { user: true } } },
    });

    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        action: 'channel.updated',
        resource: 'channel',
        resourceId: channelId,
        metadata: data,
      },
    });

    const ably = getAblyServer();
    if (ably) {
      const ablyChannel = ably.channels.get(AblyChannels.workspace(workspace.id));
      await ablyChannel.publish(EVENTS.CHANNEL_UPDATED, { channel, userId: user.id });
    }

    return channel;
  }

  @Delete(':channelId')
  async deleteChannel(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('channelId') channelId: string,
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

    await prisma.channel.delete({ where: { id: channelId, workspaceId: workspace.id } });

    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        action: 'channel.deleted',
        resource: 'channel',
        resourceId: channelId,
      },
    });

    const ably = getAblyServer();
    if (ably) {
      const ablyChannel = ably.channels.get(AblyChannels.workspace(workspace.id));
      await ablyChannel.publish(EVENTS.CHANNEL_DELETED, { channelId, userId: user.id });
    }

    return { success: true };
  }
}

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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiProperty } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { prisma } from '@repo/database';
import type { User } from '@repo/database';
import { z } from 'zod';
import { AblyChannels, EVENTS, getAblyServer } from '@repo/shared/server';

class CreateWorkspaceChannelDto {
  @ApiProperty({ example: 'general' })
  name: string;

  @ApiProperty({ required: false, example: 'The general channel for everyone' })
  description?: string;

  @ApiProperty({ required: false, enum: ['public', 'private'], default: 'public' })
  type?: 'public' | 'private';

  @ApiProperty({ required: false, example: 'dept_123' })
  departmentId?: string;

  @ApiProperty({ required: false, example: 'Hash' })
  icon?: string;
}

class UpdateWorkspaceChannelDto {
  @ApiProperty({ required: false, example: 'new-name' })
  name?: string;

  @ApiProperty({ required: false, example: 'Updated description' })
  description?: string;

  @ApiProperty({ required: false, enum: ['public', 'private'] })
  type?: 'public' | 'private';

  @ApiProperty({ required: false, example: 'MessageSquare' })
  icon?: string;
}

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

@ApiTags('Channels')
@ApiBearerAuth()
@Controller('workspaces/:slug/channels')
@UseGuards(AuthGuard)
export class ChannelsController {
  private async getWorkspaceAndVerifyMember(slug: string, userId: string, roles: string[] = []) {
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      select: {
        id: true,
        members: { where: { userId }, select: { role: true } },
      },
    });

    if (!workspace) throw new NotFoundException('Workspace not found');
    const member = workspace.members[0];
    if (!member) throw new ForbiddenException('Forbidden');
    if (roles.length > 0 && !roles.includes(member.role)) throw new ForbiddenException('Forbidden');

    return workspace;
  }

  @Get()
  @ApiOperation({ summary: 'Get all channels in a workspace' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiResponse({ status: 200, description: 'List of channels' })
  async getWorkspaceChannels(@CurrentUser() user: User, @Param('slug') slug: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      select: {
        members: { where: { userId: user.id }, select: { role: true } },
        channels: {
          where: {
            OR: [
              { isPrivate: false },
              { isPrivate: true, members: { some: { userId: user.id } } },
            ],
          },
          select: {
            id: true, name: true, slug: true, icon: true, type: true,
            description: true, isPrivate: true, workspaceId: true, parentId: true,
            createdAt: true, updatedAt: true,
            _count: { select: { messages: true } },
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!workspace) throw new NotFoundException('Workspace not found');
    if (workspace.members.length === 0) throw new ForbiddenException('Forbidden');

    return workspace.channels;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new channel in a workspace' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiBody({ type: CreateWorkspaceChannelDto })
  @ApiResponse({ status: 201, description: 'Channel created successfully' })
  async createChannel(@CurrentUser() user: User, @Param('slug') slug: string, @Body() body: CreateWorkspaceChannelDto) {
    const workspace = await this.getWorkspaceAndVerifyMember(slug, user.id, ['owner', 'admin', 'member']);

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
  @ApiOperation({ summary: 'Get channel details' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'channelId', description: 'The channel ID' })
  @ApiResponse({ status: 200, description: 'Channel details' })
  @ApiResponse({ status: 404, description: 'Channel not found' })
  async getChannel(@CurrentUser() user: User, @Param('slug') slug: string, @Param('channelId') channelId: string) {
    /**
     * 2. Uses nested 'select' and 'include' to fetch channel details, members, and counts in one round-trip.
     */
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      select: {
        id: true,
        members: {
          where: { userId: user.id },
          select: { role: true },
        },
        channels: {
          where: { id: channelId },
          include: {
            members: {
              include: {
                user: { select: { id: true, name: true, email: true, avatar: true } },
              },
            },
            _count: { select: { members: true, threads: true } },
          },
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

    const channel = workspace.channels[0];

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    return channel;
  }

  @Patch(':channelId')
  @ApiOperation({ summary: 'Update channel details' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'channelId', description: 'The channel ID' })
  @ApiBody({ type: UpdateWorkspaceChannelDto })
  @ApiResponse({ status: 200, description: 'Channel updated successfully' })
  async updateChannel(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('channelId') channelId: string,
    @Body() body: UpdateWorkspaceChannelDto
  ) {
    const workspace = await this.getWorkspaceAndVerifyMember(slug, user.id, ['owner', 'admin']);

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
  @ApiOperation({ summary: 'Delete a channel' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'channelId', description: 'The channel ID' })
  @ApiResponse({ status: 200, description: 'Channel deleted successfully' })
  async deleteChannel(@CurrentUser() user: User, @Param('slug') slug: string, @Param('channelId') channelId: string) {
    const workspace = await this.getWorkspaceAndVerifyMember(slug, user.id, ['owner', 'admin']);

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

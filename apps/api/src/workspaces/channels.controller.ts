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
import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';

class CreateWorkspaceChannelDto {
  @IsString()
  @ApiProperty({ example: 'general' })
  name: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, example: 'The general channel for everyone' })
  description?: string;

  @IsEnum(['public', 'private'])
  @IsOptional()
  @ApiProperty({ required: false, enum: ['public', 'private'], default: 'public' })
  type?: 'public' | 'private';

  @IsOptional()
  @ApiProperty({ required: false, example: false, description: 'Explicit private status flag' })
  isPrivate?: boolean;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, example: 'dept_123' })
  departmentId?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, example: 'Hash' })
  icon?: string;

  @IsOptional()
  @ApiProperty({ required: false, description: 'Custom channel metadata or branding settings' })
  metadata?: any;
}

class UpdateWorkspaceChannelDto {
  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, example: 'new-name' })
  name?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, example: 'Updated description' })
  description?: string;

  @IsEnum(['public', 'private'])
  @IsOptional()
  @ApiProperty({ required: false, enum: ['public', 'private'] })
  type?: 'public' | 'private';

  @IsOptional()
  @ApiProperty({ required: false, example: true, description: 'Explicit private status flag' })
  isPrivate?: boolean;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, example: 'MessageSquare' })
  icon?: string;

  @IsOptional()
  @ApiProperty({ required: false, description: 'Custom channel metadata or branding settings' })
  metadata?: any;
}

class AddChannelMemberDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ApiProperty({ required: false, example: ['usr_123', 'usr_456'], description: 'Array of user IDs to add' })
  userIds?: string[];

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, example: 'usr_123', description: 'User ID to add' })
  userId?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, example: 'member', description: 'Channel role' })
  role?: string;

  @IsOptional()
  @ApiProperty({ required: false, example: '2048', description: 'Bitwise permission string or integer value' })
  permissions?: string | number;
}

class UpdateChannelMemberDto {
  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, example: 'admin', enum: ['admin', 'moderator', 'member'] })
  role?: string;

  @IsOptional()
  @ApiProperty({ required: false, example: '2048', description: 'Bitwise permission string or integer value' })
  permissions?: string | number;
}

const createChannelSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  type: z.enum(['public', 'private']).optional(),
  isPrivate: z.boolean().optional(),
  departmentId: z.string().optional(),
  icon: z.string().optional(),
  metadata: z.any().optional(),
});

const updateChannelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  type: z.enum(['public', 'private']).optional(),
  isPrivate: z.boolean().optional(),
  icon: z.string().optional(),
  metadata: z.any().optional(),
});

const updateChannelMemberSchema = z.object({
  role: z.string().optional(),
  permissions: z.union([z.string(), z.number()]).optional(),
});

@ApiTags('Channels')
@ApiBearerAuth()
@Controller('workspaces/:slug/channels')
@UseGuards(AuthGuard)
export class ChannelsController {
  @Get()
  @ApiOperation({ summary: 'Get all channels in a workspace' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiResponse({ status: 200, description: 'List of channels' })
  async getWorkspaceChannels(@CurrentUser() user: User, @Param('slug') slug: string) {
    /**
     * ⚡ Performance Optimization:
     * 1. Consolidates workspace lookup, membership verification, and channel retrieval into a single query.
     * 2. Uses nested 'select' to fetch only required fields and relations (like message counts).
     * 3. Reduces database round-trips from 2 down to 1 while maintaining access control.
     * 4. Fetches unread/mention counts directly using database-level `groupBy` aggregation rather than fetching full records into Node memory.
     * 5. Maps counts in-memory with O(1) Map lookups.
     * Expected impact: Faster response times for channel list loading and significantly reduced database payload size.
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
          where: {
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
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
            type: true,
            description: true,
            isPrivate: true,
            workspaceId: true,
            parentId: true,
            createdAt: true,
            updatedAt: true,
            _count: { select: { messages: true } },
          },
          orderBy: {
            name: 'asc',
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

    const channelIds = workspace.channels.map(channel => channel.id);
    const unreadMap = new Map<string, number>();
    const mentionMap = new Map<string, number>();

    if (channelIds.length > 0) {
      const [unreadCounts, mentionCounts] = await Promise.all([
        prisma.message.groupBy({
          by: ['channelId'],
          where: {
            channelId: { in: channelIds },
            userId: { not: user.id },
            readBy: {
              none: {
                userId: user.id,
              },
            },
          },
          _count: {
            id: true,
          },
        }),
        prisma.message.groupBy({
          by: ['channelId'],
          where: {
            channelId: { in: channelIds },
            userId: { not: user.id },
            readBy: {
              none: {
                userId: user.id,
              },
            },
            mentions: {
              some: {
                mention: {
                  in: [
                    '@all',
                    '@here',
                    user.name ? `@${user.name}` : '',
                    user.username ? `@${user.username}` : '',
                  ].filter(Boolean),
                },
              },
            },
          },
          _count: {
            id: true,
          },
        }),
      ]);

      for (const item of unreadCounts) {
        unreadMap.set(item.channelId, item._count.id);
      }

      for (const item of mentionCounts) {
        mentionMap.set(item.channelId, item._count.id);
      }
    }

    return workspace.channels.map(channel => {
      return {
        ...channel,
        unreadCount: unreadMap.get(channel.id) || 0,
        mentionCount: mentionMap.get(channel.id) || 0,
      };
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create a new channel in a workspace' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiBody({ type: CreateWorkspaceChannelDto })
  @ApiResponse({ status: 201, description: 'Channel created successfully' })
  async createChannel(@CurrentUser() user: User, @Param('slug') slug: string, @Body() body: CreateWorkspaceChannelDto) {
    console.log(body);
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

    const member = workspace.members[0];

    if (!member || !['owner', 'admin', 'member'].includes(member.role)) {
      throw new ForbiddenException('Forbidden');
    }

    const validatedData = createChannelSchema.safeParse(body);
    if (!validatedData.success) {
      console.log(validatedData.error.issues);
      throw new BadRequestException(validatedData.error.issues);
    }
    const data = validatedData.data;

    const channelSlug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const isPrivate = data.isPrivate !== undefined ? data.isPrivate : data.type === 'private';
    const type = data.type || (isPrivate ? 'private' : 'public');

    const channel = await prisma.channel.create({
      data: {
        name: data.name,
        slug: channelSlug,
        description: data.description,
        type,
        isPrivate,
        icon: data.icon || '#',
        metadata: data.metadata ?? undefined,
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
     * ⚡ Performance Optimization:
     * 1. Replaces workspace-slug point-lookup containing nested channel filtering with a direct O(1) point-lookup on prisma.channel.findUnique by id.
     * 2. Uses nested 'select'/'include' to retrieve the workspace slug and user's membership in a single round-trip.
     * 3. Performs workspace validation and authorization in application memory.
     * Expected impact: Directly leverages the primary key index on 'id', eliminating secondary scans and reducing database load.
     */
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        workspace: {
          select: {
            id: true,
            slug: true,
            members: {
              where: { userId: user.id },
              select: { role: true },
            },
          },
        },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
        _count: { select: { members: true, threads: true } },
      },
    });

    if (!channel || !channel.workspace || channel.workspace.slug !== slug) {
      throw new NotFoundException('Channel not found');
    }

    const member = channel.workspace.members[0];

    if (!member) {
      throw new ForbiddenException('Forbidden');
    }

    // Omit workspace from the returned channel object to strictly match public API response schema/contract
    const { workspace: _workspace, ...channelResponse } = channel;

    return channelResponse;
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

    const member = workspace.members[0];

    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new ForbiddenException('Forbidden');
    }

    const validatedData = updateChannelSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }
    const data = validatedData.data;

    const isPrivate = data.isPrivate !== undefined ? data.isPrivate : (data.type ? data.type === 'private' : undefined);
    const type = data.type !== undefined ? data.type : (isPrivate !== undefined ? (isPrivate ? 'private' : 'public') : undefined);

    const channel = await prisma.channel.update({
      where: { id: channelId, workspaceId: workspace.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(type !== undefined && { type }),
        ...(isPrivate !== undefined && { isPrivate }),
        ...(data.icon && { icon: data.icon }),
        ...(data.metadata !== undefined && { metadata: data.metadata }),
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

    const member = workspace.members[0];

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

  @Get(':channelId/members')
  @ApiOperation({ summary: 'Get members of a channel' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'channelId', description: 'The channel ID' })
  @ApiResponse({ status: 200, description: 'List of channel members' })
  async getChannelMembers(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('channelId') channelId: string
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

    if (workspace.members.length === 0) {
      throw new ForbiddenException('Forbidden');
    }

    const members = await prisma.channelMember.findMany({
      where: { channelId, channel: { workspaceId: workspace.id } },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true, status: true },
        },
      },
    });

    return members;
  }

  @Post(':channelId/members')
  @ApiOperation({ summary: 'Add members to a channel' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'channelId', description: 'The channel ID' })
  @ApiBody({ type: AddChannelMemberDto })
  @ApiResponse({ status: 201, description: 'Members added to channel' })
  async addChannelMembers(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('channelId') channelId: string,
    @Body() body: AddChannelMemberDto
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

    if (workspace.members.length === 0) {
      throw new ForbiddenException('Forbidden');
    }

    const userIdsToAdd = body.userIds || (body.userId ? [body.userId] : []);
    if (userIdsToAdd.length === 0) {
      throw new BadRequestException('userId or userIds required');
    }

    const channel = await prisma.channel.findUnique({
      where: { id: channelId, workspaceId: workspace.id },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    let permissionsBigInt: bigint | null = null;
    if (body.permissions !== undefined) {
      try {
        permissionsBigInt = BigInt(body.permissions);
      } catch (err) {
        throw new BadRequestException('Invalid bitwise permissions format');
      }
    }

    await prisma.channelMember.createMany({
      data: userIdsToAdd.map(uId => ({
        channelId,
        userId: uId,
        role: body.role || 'member',
        permissions: permissionsBigInt,
      })),
      skipDuplicates: true,
    });

    const updatedMembers = await prisma.channelMember.findMany({
      where: { channelId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    return updatedMembers;
  }

  @Patch(':channelId/members/:targetUserId')
  @ApiOperation({ summary: 'Update channel member role and permissions' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'channelId', description: 'The channel ID' })
  @ApiParam({ name: 'targetUserId', description: 'The user ID to update' })
  @ApiBody({ type: UpdateChannelMemberDto })
  @ApiResponse({ status: 200, description: 'Channel member updated' })
  async updateChannelMember(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('channelId') channelId: string,
    @Param('targetUserId') targetUserId: string,
    @Body() body: UpdateChannelMemberDto
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

    if (workspace.members.length === 0) {
      throw new ForbiddenException('Forbidden');
    }

    const validatedData = updateChannelMemberSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }
    const data = validatedData.data;

    let permissionsBigInt: bigint | undefined = undefined;
    if (data.permissions !== undefined) {
      try {
        permissionsBigInt = BigInt(data.permissions);
      } catch (err) {
        throw new BadRequestException('Invalid bitwise permissions format');
      }
    }

    try {
      const updatedMember = await prisma.channelMember.update({
        where: {
          channelId_userId: {
            channelId,
            userId: targetUserId,
          },
        },
        data: {
          ...(data.role && { role: data.role }),
          ...(permissionsBigInt !== undefined && { permissions: permissionsBigInt }),
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
      });

      return {
        ...updatedMember,
        permissions: updatedMember.permissions ? updatedMember.permissions.toString() : null,
      };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Member not found in this channel');
      }
      throw error;
    }
  }

  @Delete(':channelId/members/:targetUserId')
  @ApiOperation({ summary: 'Remove a member from a channel' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'channelId', description: 'The channel ID' })
  @ApiParam({ name: 'targetUserId', description: 'The user ID to remove' })
  @ApiResponse({ status: 200, description: 'Member removed from channel' })
  async removeChannelMember(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('channelId') channelId: string,
    @Param('targetUserId') targetUserId: string
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

    if (workspace.members.length === 0) {
      throw new ForbiddenException('Forbidden');
    }

    await prisma.channelMember.deleteMany({
      where: {
        channelId,
        userId: targetUserId,
        channel: { workspaceId: workspace.id },
      },
    });

    return { success: true };
  }
}
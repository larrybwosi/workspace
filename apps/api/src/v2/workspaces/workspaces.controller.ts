import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Inject,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiProperty,
} from '@nestjs/swagger';
import { ApiV2Guard } from '../../auth/api-v2.guard';
import type { ApiV2Context } from '../../auth/api-v2.guard';
import { V2Context } from '../../auth/v2-context.decorator';
import { prisma } from '@repo/database';
import Redis from 'ioredis';
import { z } from 'zod';
import { V2AuditService } from '../v2-audit.service';
import { auth } from '../../auth/better-auth';

class AddMemberDto {
  @ApiProperty({ example: 'user@example.com', description: 'The email of the user to add' })
  email: string;

  @ApiProperty({ example: 'member', description: 'The role of the member', required: false, default: 'member' })
  role?: string;
}

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.string().optional().default('member'),
});

@ApiTags('Members')
@ApiBearerAuth()
@Controller('v2/workspaces/:slug/members')
@UseGuards(ApiV2Guard)
export class V2WorkspacesController {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly auditService: V2AuditService
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all workspace members', description: 'Requires members:read scope.' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiResponse({ status: 200, description: 'List of members returned successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden: Missing scope.' })
  async getMembers(@V2Context() context: ApiV2Context) {
    if (!this.hasScope(context, 'members:read')) {
      throw new ForbiddenException('Forbidden: Missing members:read scope');
    }

    const cacheKey = `v2:members:${context.workspaceId}`;
    const cachedMembers = await this.redis.get(cacheKey);

    if (cachedMembers) {
      return { members: JSON.parse(cachedMembers), source: 'cache' };
    }

    const members = await prisma.workspaceMember.findMany({
      where: {
        workspaceId: context.workspaceId,
      },
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
    });

    await this.redis.setex(cacheKey, 600, JSON.stringify(members));

    await this.auditService.log(context, 'members.list', 'member');

    return { members, source: 'database' };
  }

  @Post()
  @ApiOperation({ summary: 'Add a member to the workspace', description: 'Requires members:write scope.' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiBody({ type: AddMemberDto })
  @ApiResponse({ status: 201, description: 'Member added successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async addMember(@V2Context() context: ApiV2Context, @Body() body: AddMemberDto) {
    if (!this.hasScope(context, 'members:write')) {
      throw new ForbiddenException('Forbidden: Missing members:write scope');
    }

    const validatedData = addMemberSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }

    const { email, role } = validatedData.data;

    const userToAdd = await prisma.user.findUnique({
      where: { email },
    });

    if (!userToAdd) {
      throw new NotFoundException('User not found');
    }

    const membership = await prisma.workspaceMember.create({
      data: {
        workspaceId: context.workspaceId!,
        userId: userToAdd.id,
        role,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await this.redis.del(`v2:members:${context.workspaceId}`);

    await this.auditService.log(context, 'members.add', 'member', userToAdd.id, {
      email,
      role,
    });

    return { member: membership };
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get details of a specific workspace member', description: 'Requires members:read scope.' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'userId', description: 'The ID of the user' })
  @ApiResponse({ status: 200, description: 'Member details returned successfully.' })
  @ApiResponse({ status: 404, description: 'Member not found.' })
  async getMember(@V2Context() context: ApiV2Context, @Param('userId') userId: string) {
    if (!this.hasScope(context, 'members:read')) {
      throw new ForbiddenException('Forbidden: Missing members:read scope');
    }

    const member = await prisma.workspaceMember.findFirst({
      where: {
        userId,
        workspaceId: context.workspaceId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            status: true,
            role: true,
          },
        },
        department: { select: { id: true, name: true } },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found in this workspace');
    }

    await this.auditService.log(context, 'members.get', 'member', userId);

    return { member };
  }

  @Delete(':userId')
  @ApiOperation({ summary: 'Remove a member from the workspace', description: 'Requires members:write scope.' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'userId', description: 'The ID of the user' })
  @ApiResponse({ status: 200, description: 'Member removed successfully.' })
  @ApiResponse({ status: 400, description: 'Cannot remove workspace owner.' })
  @ApiResponse({ status: 404, description: 'Member not found.' })
  async removeMember(@V2Context() context: ApiV2Context, @Param('userId') userId: string) {
    if (!this.hasScope(context, 'members:write')) {
      throw new ForbiddenException('Forbidden: Missing members:write scope');
    }

    const member = await prisma.workspaceMember.findFirst({
      where: {
        userId,
        workspaceId: context.workspaceId,
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found in this workspace');
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: context.workspaceId },
    });

    if (workspace?.ownerId === userId) {
      throw new BadRequestException('Cannot remove workspace owner');
    }

    await prisma.workspaceMember.delete({
      where: {
        id: member.id,
      },
    });

    await this.redis.del(`v2:members:${context.workspaceId}`);

    await this.auditService.log(context, 'members.remove', 'member', userId);

    return { success: true };
  }

  private hasScope(context: ApiV2Context, scope: string): boolean {
    return context.scopes.includes(scope) || context.scopes.includes('*');
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Inject,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiV2Guard } from '../../auth/api-v2.guard';
import type { ApiV2Context } from '../../auth/api-v2.guard';
import { V2Context } from '../../auth/v2-context.decorator';
import { prisma } from '@repo/database';
import Redis from 'ioredis';
import { z } from 'zod';

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.string().optional().default('member'),
});

@Controller('v2/workspaces/:slug')
@UseGuards(ApiV2Guard)
export class V2WorkspacesController {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  @Get('members')
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

    return { members, source: 'database' };
  }

  @Post('members')
  async addMember(@V2Context() context: ApiV2Context, @Body() body: any) {
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

    return { member: membership };
  }

  private hasScope(context: ApiV2Context, scope: string): boolean {
    return context.scopes.includes(scope) || context.scopes.includes('*');
  }
}

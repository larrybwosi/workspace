import {
  Controller,
  Get,
  Post,
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
import * as crypto from 'crypto';

const createTokenSchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z.object({
    departments: z.array(z.string()).optional(),
    teams: z.array(z.string()).optional(),
    actions: z.array(
      z.enum([
        'read:members',
        'write:members',
        'read:departments',
        'write:departments',
        'read:teams',
        'write:teams',
        'read:announcements',
        'write:announcements',
        'read:channels',
        'write:channels',
        'send:messages',
      ]),
    ),
  }),
  rateLimit: z.number().min(100).max(100000).optional().default(1000),
  expiresAt: z.string().datetime().optional(),
});

@Controller('workspaces/:slug/api-tokens')
@UseGuards(AuthGuard)
export class ApiTokensController {
  @Get()
  async getApiTokens(@CurrentUser() user: User, @Param('slug') slug: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId: user.id } },
    });

    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new ForbiddenException('Forbidden');
    }

    const tokens = await prisma.workspaceApiToken.findMany({
      where: { workspaceId: workspace.id },
      select: {
        id: true,
        name: true,
        token: true,
        permissions: true,
        rateLimit: true,
        expiresAt: true,
        lastUsedAt: true,
        usageCount: true,
        createdAt: true,
        createdBy: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const maskedTokens = tokens.map((t) => ({
      ...t,
      token: `wst_${'*'.repeat(24)}${t.token.slice(-8)}`,
    }));

    return { tokens: maskedTokens };
  }

  @Post()
  async createApiToken(
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
      where: { workspaceId_userId: { workspaceId: workspace.id, userId: user.id } },
    });

    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new ForbiddenException('Forbidden');
    }

    const validatedData = createTokenSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }
    const data = validatedData.data;

    const token = `wst_${crypto.randomBytes(32).toString('hex')}`;

    const apiToken = await prisma.workspaceApiToken.create({
      data: {
        workspaceId: workspace.id,
        name: data.name,
        token,
        permissions: data.permissions as any,
        rateLimit: data.rateLimit,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        createdById: user.id,
      },
    });

    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        action: 'api_token.created',
        resource: 'api_token',
        resourceId: apiToken.id,
        metadata: { name: data.name, permissions: data.permissions.actions },
      },
    });

    return {
      ...apiToken,
      token,
    };
  }

  @Delete(':tokenId')
  async deleteApiToken(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('tokenId') tokenId: string,
  ) {
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId: user.id } },
    });

    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new ForbiddenException('Forbidden');
    }

    await prisma.workspaceApiToken.delete({
      where: { id: tokenId },
    });

    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        action: 'api_token.deleted',
        resource: 'api_token',
        resourceId: tokenId,
        metadata: {},
      },
    });

    return { message: 'API token deleted successfully' };
  }
}

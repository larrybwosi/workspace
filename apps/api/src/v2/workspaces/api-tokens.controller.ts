import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiV2Guard } from '../../auth/api-v2.guard';
import type { ApiV2Context } from '../../auth/api-v2.guard';
import { V2Context } from '../../auth/v2-context.decorator';
import { prisma } from '@repo/database';
import { V2AuditService } from '../v2-audit.service';
import { z } from 'zod';
import * as crypto from 'crypto';

const createTokenSchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z.object({
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
        'read:messages',
        'read:threads',
        'read:webhooks',
        'write:webhooks',
        'read:tokens',
        'write:tokens',
      ]),
    ),
  }),
  rateLimit: z.number().min(100).max(100000).optional().default(1000),
  expiresAt: z.string().datetime().optional().nullable(),
});

@Controller('v2/workspaces/:slug/api-tokens')
@UseGuards(ApiV2Guard)
export class V2ApiTokensController {
  constructor(private readonly auditService: V2AuditService) {}

  @Get()
  async getTokens(@V2Context() context: ApiV2Context) {
    if (!this.hasScope(context, 'tokens:read')) {
      throw new ForbiddenException('Forbidden: Missing tokens:read scope');
    }

    const tokens = await prisma.workspaceApiToken.findMany({
      where: { workspaceId: context.workspaceId },
      select: {
        id: true,
        name: true,
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

    await this.auditService.log(context, 'tokens.list', 'api_token');

    return { tokens };
  }

  @Post()
  async createToken(@V2Context() context: ApiV2Context, @Body() body: any) {
    if (!this.hasScope(context, 'tokens:write')) {
      throw new ForbiddenException('Forbidden: Missing tokens:write scope');
    }

    const validatedData = createTokenSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }

    const data = validatedData.data;
    const rawToken = `wst_${crypto.randomBytes(32).toString('hex')}`;
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const apiToken = await prisma.workspaceApiToken.create({
      data: {
        workspaceId: context.workspaceId!,
        name: data.name,
        token: hashedToken,
        permissions: data.permissions as any,
        rateLimit: data.rateLimit,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        createdById: context.userId,
      },
    });

    await this.auditService.log(
      context,
      'tokens.create',
      'api_token',
      apiToken.id,
      { name: data.name },
    );

    return { ...apiToken, token: rawToken };
  }

  @Delete(':tokenId')
  async deleteToken(
    @V2Context() context: ApiV2Context,
    @Param('tokenId') tokenId: string,
  ) {
    if (!this.hasScope(context, 'tokens:write')) {
      throw new ForbiddenException('Forbidden: Missing tokens:write scope');
    }

    const token = await prisma.workspaceApiToken.findUnique({
      where: { id: tokenId, workspaceId: context.workspaceId },
    });

    if (!token) {
      throw new NotFoundException('Token not found');
    }

    await prisma.workspaceApiToken.delete({
      where: { id: tokenId },
    });

    await this.auditService.log(
      context,
      'tokens.delete',
      'api_token',
      tokenId,
      { name: token.name },
    );

    return { success: true };
  }

  @Post(':tokenId/rotate')
  async rotateToken(
    @V2Context() context: ApiV2Context,
    @Param('tokenId') tokenId: string,
  ) {
    if (!this.hasScope(context, 'tokens:write')) {
      throw new ForbiddenException('Forbidden: Missing tokens:write scope');
    }

    const existingToken = await prisma.workspaceApiToken.findUnique({
      where: { id: tokenId, workspaceId: context.workspaceId },
    });

    if (!existingToken) {
      throw new NotFoundException('Token not found');
    }

    const rawToken = `wst_${crypto.randomBytes(32).toString('hex')}`;
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const updatedToken = await prisma.workspaceApiToken.update({
      where: { id: tokenId },
      data: {
        token: hashedToken,
        updatedAt: new Date(),
      },
    });

    await this.auditService.log(
      context,
      'tokens.rotate',
      'api_token',
      tokenId,
      { name: existingToken.name },
    );

    return { ...updatedToken, token: rawToken };
  }

  private hasScope(context: ApiV2Context, scope: string): boolean {
    return context.scopes.includes(scope) || context.scopes.includes('*');
  }
}

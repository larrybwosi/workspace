import {
  Controller,
  Get,
  Post,
  Patch,
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
import { z } from 'zod';
import { V2AuditService } from '../v2-audit.service';

const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  departmentId: z.string().optional(),
  leadId: z.string().optional(),
});

const updateTeamSchema = createTeamSchema.partial();

@Controller('v2/workspaces/:slug/teams')
@UseGuards(ApiV2Guard)
export class V2TeamsController {
  constructor(private readonly auditService: V2AuditService) {}

  @Get()
  async getTeams(@V2Context() context: ApiV2Context) {
    if (!this.hasScope(context, 'teams:read')) {
      throw new ForbiddenException('Forbidden: Missing teams:read scope');
    }

    const teams = await prisma.workspaceTeam.findMany({
      where: { workspaceId: context.workspaceId },
      include: {
        department: { select: { id: true, name: true } },
        _count: { select: { members: true } },
      },
    });

    await this.auditService.log(context, 'teams.list', 'team');

    return { teams };
  }

  @Post()
  async createTeam(@V2Context() context: ApiV2Context, @Body() body: any) {
    if (!this.hasScope(context, 'teams:write')) {
      throw new ForbiddenException('Forbidden: Missing teams:write scope');
    }

    const validatedData = createTeamSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }

    const team = await prisma.workspaceTeam.create({
      data: {
        ...validatedData.data,
        workspaceId: context.workspaceId!,
      },
    });

    await this.auditService.log(context, 'teams.create', 'team', team.id, validatedData.data);

    return { team };
  }

  @Get(':teamId')
  async getTeam(@V2Context() context: ApiV2Context, @Param('teamId') teamId: string) {
    if (!this.hasScope(context, 'teams:read')) {
      throw new ForbiddenException('Forbidden: Missing teams:read scope');
    }

    const team = await prisma.workspaceTeam.findFirst({
      where: { id: teamId, workspaceId: context.workspaceId },
      include: {
        department: true,
        members: { include: { user: { select: { id: true, name: true, avatar: true } } } },
      },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    await this.auditService.log(context, 'teams.get', 'team', teamId);

    return { team };
  }

  @Patch(':teamId')
  async updateTeam(@V2Context() context: ApiV2Context, @Param('teamId') teamId: string, @Body() body: any) {
    if (!this.hasScope(context, 'teams:write')) {
      throw new ForbiddenException('Forbidden: Missing teams:write scope');
    }

    const validatedData = updateTeamSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }

    const team = await prisma.workspaceTeam.update({
      where: { id: teamId, workspaceId: context.workspaceId },
      data: validatedData.data,
    });

    await this.auditService.log(context, 'teams.update', 'team', teamId, validatedData.data);

    return { team };
  }

  @Delete(':teamId')
  async deleteTeam(@V2Context() context: ApiV2Context, @Param('teamId') teamId: string) {
    if (!this.hasScope(context, 'teams:write')) {
      throw new ForbiddenException('Forbidden: Missing teams:write scope');
    }

    await prisma.workspaceTeam.delete({
      where: { id: teamId, workspaceId: context.workspaceId },
    });

    await this.auditService.log(context, 'teams.delete', 'team', teamId);

    return { success: true };
  }

  private hasScope(context: ApiV2Context, scope: string): boolean {
    return context.scopes.includes(scope) || context.scopes.includes('*');
  }
}

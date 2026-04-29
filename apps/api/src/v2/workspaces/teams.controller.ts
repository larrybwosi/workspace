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
import { z } from 'zod';
import { V2AuditService } from '../v2-audit.service';

class CreateTeamDto {
  @ApiProperty({ example: 'Engineering' })
  name: string;
  @ApiProperty({ example: 'engineering' })
  slug: string;
  @ApiProperty({ required: false })
  description?: string;
  @ApiProperty({ required: false })
  icon?: string;
  @ApiProperty({ required: false })
  color?: string;
  @ApiProperty({ required: false })
  departmentId?: string;
  @ApiProperty({ required: false })
  leadId?: string;
}

class UpdateTeamDto {
  @ApiProperty({ required: false })
  name?: string;
  @ApiProperty({ required: false })
  slug?: string;
  @ApiProperty({ required: false })
  description?: string;
  @ApiProperty({ required: false })
  icon?: string;
  @ApiProperty({ required: false })
  color?: string;
  @ApiProperty({ required: false })
  departmentId?: string;
  @ApiProperty({ required: false })
  leadId?: string;
}

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

@ApiTags('Teams')
@ApiBearerAuth()
@Controller('v2/workspaces/:slug/teams')
@UseGuards(ApiV2Guard)
export class V2TeamsController {
  constructor(private readonly auditService: V2AuditService) {}

  @Get()
  @ApiOperation({ summary: 'List all teams in the workspace', description: 'Requires teams:read scope.' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiResponse({ status: 200, description: 'List of teams returned successfully.' })
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
  @ApiOperation({ summary: 'Create a new team', description: 'Requires teams:write scope.' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiBody({ type: CreateTeamDto })
  @ApiResponse({ status: 201, description: 'Team created successfully.' })
  async createTeam(@V2Context() context: ApiV2Context, @Body() body: CreateTeamDto) {
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
  @ApiOperation({ summary: 'Get details of a specific team', description: 'Requires teams:read scope.' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'teamId', description: 'The team ID' })
  @ApiResponse({ status: 200, description: 'Team details returned successfully.' })
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
  @ApiOperation({ summary: 'Update a team', description: 'Requires teams:write scope.' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'teamId', description: 'The team ID' })
  @ApiBody({ type: UpdateTeamDto })
  @ApiResponse({ status: 200, description: 'Team updated successfully.' })
  async updateTeam(@V2Context() context: ApiV2Context, @Param('teamId') teamId: string, @Body() body: UpdateTeamDto) {
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
  @ApiOperation({ summary: 'Delete a team', description: 'Requires teams:write scope.' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'teamId', description: 'The team ID' })
  @ApiResponse({ status: 200, description: 'Team deleted successfully.' })
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

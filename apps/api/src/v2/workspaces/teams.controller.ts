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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiV2Guard } from '../../auth/api-v2.guard';
import type { ApiV2Context } from '../../auth/api-v2.guard';
import { V2Context } from '../../auth/v2-context.decorator';
import { prisma } from '@repo/database';
import { z } from 'zod';
import { V2AuditService } from '../v2-audit.service';
import { SanityService } from '../../common/sanity/sanity.service';

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

const createIntegrationSchema = z.object({
  service: z.string().min(1),
  config: z.record(z.any()),
  active: z.boolean().optional().default(true),
});

const updateIntegrationSchema = createIntegrationSchema.partial();

const createApprovalSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  metadata: z.record(z.any()).optional(),
});

const respondApprovalSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  comment: z.string().max(500).optional(),
});

@Controller('v2/workspaces/:slug/teams')
@UseGuards(ApiV2Guard)
export class V2TeamsController {
  constructor(
    private readonly auditService: V2AuditService,
    private readonly sanityService: SanityService,
  ) {}

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

  // --- TEAM FILES ---

  @Get(':teamId/files')
  async getTeamFiles(@V2Context() context: ApiV2Context, @Param('teamId') teamId: string) {
    if (!this.hasScope(context, 'teams:read')) {
      throw new ForbiddenException('Forbidden: Missing teams:read scope');
    }

    const files = await prisma.workspaceTeamFile.findMany({
      where: { teamId, team: { workspaceId: context.workspaceId } },
      include: { uploadedBy: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return { files };
  }

  @Post(':teamId/files')
  @UseInterceptors(FileInterceptor('file'))
  async uploadTeamFile(
    @V2Context() context: ApiV2Context,
    @Param('teamId') teamId: string,
    @UploadedFile() file: any,
  ) {
    if (!this.hasScope(context, 'teams:write')) {
      throw new ForbiddenException('Forbidden: Missing teams:write scope');
    }

    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Verify team exists in workspace
    const team = await prisma.workspaceTeam.findFirst({
      where: { id: teamId, workspaceId: context.workspaceId },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const uploaded = await this.sanityService.uploadFile(file);

    const teamFile = await prisma.workspaceTeamFile.create({
      data: {
        teamId,
        name: uploaded.name,
        url: uploaded.url,
        type: uploaded.type,
        size: file.size,
        uploadedById: context.userId,
      },
    });

    await this.auditService.log(context, 'teams.files.upload', 'team_file', teamFile.id, {
      teamId,
      fileName: teamFile.name,
    });

    return { file: teamFile };
  }

  @Delete(':teamId/files/:fileId')
  async deleteTeamFile(
    @V2Context() context: ApiV2Context,
    @Param('teamId') teamId: string,
    @Param('fileId') fileId: string,
  ) {
    if (!this.hasScope(context, 'teams:write')) {
      throw new ForbiddenException('Forbidden: Missing teams:write scope');
    }

    const file = await prisma.workspaceTeamFile.findFirst({
      where: { id: fileId, teamId, team: { workspaceId: context.workspaceId } },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    await prisma.workspaceTeamFile.delete({ where: { id: fileId } });

    await this.auditService.log(context, 'teams.files.delete', 'team_file', fileId, {
      teamId,
      fileName: file.name,
    });

    return { success: true };
  }

  // --- TEAM INTEGRATIONS ---

  @Get(':teamId/integrations')
  async getTeamIntegrations(@V2Context() context: ApiV2Context, @Param('teamId') teamId: string) {
    if (!this.hasScope(context, 'teams:read')) {
      throw new ForbiddenException('Forbidden: Missing teams:read scope');
    }

    const integrations = await prisma.workspaceIntegration.findMany({
      where: { teamId, workspaceId: context.workspaceId },
    });

    return { integrations };
  }

  @Post(':teamId/integrations')
  async createTeamIntegration(
    @V2Context() context: ApiV2Context,
    @Param('teamId') teamId: string,
    @Body() body: any,
  ) {
    if (!this.hasScope(context, 'teams:write')) {
      throw new ForbiddenException('Forbidden: Missing teams:write scope');
    }

    const validatedData = createIntegrationSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }

    // Verify team exists in workspace
    const team = await prisma.workspaceTeam.findFirst({
      where: { id: teamId, workspaceId: context.workspaceId },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const integration = await prisma.workspaceIntegration.create({
      data: {
        ...validatedData.data,
        teamId,
        workspaceId: context.workspaceId!,
      },
    });

    await this.auditService.log(context, 'teams.integrations.create', 'integration', integration.id, {
      teamId,
      service: integration.service,
    });

    return { integration };
  }

  @Patch(':teamId/integrations/:integrationId')
  async updateTeamIntegration(
    @V2Context() context: ApiV2Context,
    @Param('teamId') teamId: string,
    @Param('integrationId') integrationId: string,
    @Body() body: any,
  ) {
    if (!this.hasScope(context, 'teams:write')) {
      throw new ForbiddenException('Forbidden: Missing teams:write scope');
    }

    const validatedData = updateIntegrationSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }

    const integration = await prisma.workspaceIntegration.update({
      where: { id: integrationId, teamId, workspaceId: context.workspaceId },
      data: validatedData.data,
    });

    await this.auditService.log(context, 'teams.integrations.update', 'integration', integrationId, {
      teamId,
      ...validatedData.data,
    });

    return { integration };
  }

  @Delete(':teamId/integrations/:integrationId')
  async deleteTeamIntegration(
    @V2Context() context: ApiV2Context,
    @Param('teamId') teamId: string,
    @Param('integrationId') integrationId: string,
  ) {
    if (!this.hasScope(context, 'teams:write')) {
      throw new ForbiddenException('Forbidden: Missing teams:write scope');
    }

    await prisma.workspaceIntegration.delete({
      where: { id: integrationId, teamId, workspaceId: context.workspaceId },
    });

    await this.auditService.log(context, 'teams.integrations.delete', 'integration', integrationId, { teamId });

    return { success: true };
  }

  // --- TEAM APPROVALS ---

  @Get(':teamId/approvals')
  async getTeamApprovals(@V2Context() context: ApiV2Context, @Param('teamId') teamId: string) {
    if (!this.hasScope(context, 'teams:read')) {
      throw new ForbiddenException('Forbidden: Missing teams:read scope');
    }

    const approvals = await prisma.workspaceTeamApproval.findMany({
      where: { teamId, team: { workspaceId: context.workspaceId } },
      include: {
        requestedBy: { select: { id: true, name: true, avatar: true } },
        responses: { include: { user: { select: { id: true, name: true, avatar: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { approvals };
  }

  @Post(':teamId/approvals')
  async createTeamApproval(
    @V2Context() context: ApiV2Context,
    @Param('teamId') teamId: string,
    @Body() body: any,
  ) {
    if (!this.hasScope(context, 'teams:write')) {
      throw new ForbiddenException('Forbidden: Missing teams:write scope');
    }

    const validatedData = createApprovalSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }

    // Verify team exists in workspace
    const team = await prisma.workspaceTeam.findFirst({
      where: { id: teamId, workspaceId: context.workspaceId },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const approval = await prisma.workspaceTeamApproval.create({
      data: {
        ...validatedData.data,
        teamId,
        requestedById: context.userId,
      },
    });

    await this.auditService.log(context, 'teams.approvals.create', 'approval', approval.id, {
      teamId,
      title: approval.title,
    });

    return { approval };
  }

  @Post(':teamId/approvals/:approvalId/responses')
  async respondToApproval(
    @V2Context() context: ApiV2Context,
    @Param('teamId') teamId: string,
    @Param('approvalId') approvalId: string,
    @Body() body: any,
  ) {
    if (!this.hasScope(context, 'teams:write')) {
      throw new ForbiddenException('Forbidden: Missing teams:write scope');
    }

    const validatedData = respondApprovalSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }

    const approval = await prisma.workspaceTeamApproval.findFirst({
      where: { id: approvalId, teamId, team: { workspaceId: context.workspaceId } },
    });

    if (!approval) {
      throw new NotFoundException('Approval request not found');
    }

    if (approval.status !== 'pending') {
      throw new BadRequestException('Approval request is already closed');
    }

    const response = await prisma.workspaceTeamApprovalResponse.upsert({
      where: { approvalId_userId: { approvalId, userId: context.userId } },
      create: {
        approvalId,
        userId: context.userId,
        decision: validatedData.data.decision,
        comment: validatedData.data.comment,
      },
      update: {
        decision: validatedData.data.decision,
        comment: validatedData.data.comment,
      },
    });

    // Simple logic: if anyone rejects, it's rejected. If we have enough approvals (could be more complex), mark as approved.
    // For now, let's just update based on the latest decision if it's a lead or just track responses.
    // Re-evaluating status:
    const allResponses = await prisma.workspaceTeamApprovalResponse.findMany({
      where: { approvalId },
    });

    if (validatedData.data.decision === 'rejected') {
      await prisma.workspaceTeamApproval.update({
        where: { id: approvalId },
        data: { status: 'rejected' },
      });
    } else {
      // If at least one approval and no rejections (already handled), we could mark as approved
      // or wait for a specific number. Let's mark as approved for now if it's the first approval.
      await prisma.workspaceTeamApproval.update({
        where: { id: approvalId },
        data: { status: 'approved' },
      });
    }

    await this.auditService.log(context, 'teams.approvals.respond', 'approval_response', response.id, {
      teamId,
      approvalId,
      decision: validatedData.data.decision,
    });

    return { response };
  }

  // --- TEAM ANALYTICS ---

  @Get(':teamId/analytics')
  async getTeamAnalytics(@V2Context() context: ApiV2Context, @Param('teamId') teamId: string) {
    if (!this.hasScope(context, 'teams:read')) {
      throw new ForbiddenException('Forbidden: Missing teams:read scope');
    }

    const analytics = await prisma.workspaceTeamAnalytics.findMany({
      where: { teamId, team: { workspaceId: context.workspaceId } },
      orderBy: { date: 'desc' },
      take: 30, // Last 30 entries
    });

    return { analytics };
  }

  private hasScope(context: ApiV2Context, scope: string): boolean {
    return context.scopes.includes(scope) || context.scopes.includes('*');
  }
}

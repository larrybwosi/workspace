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

const createAnnouncementSchema = z.object({
  departmentId: z.string().min(1),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional().default('normal'),
  pinned: z.boolean().optional().default(false),
  publishAt: z.string().datetime().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  targetAudience: z.record(z.string(), z.any()).optional(),
  attachments: z.array(z.any()).optional(),
});

const updateAnnouncementSchema = createAnnouncementSchema.partial();

@Controller('v2/workspaces/:slug/announcements')
@UseGuards(ApiV2Guard)
export class V2AnnouncementsController {
  constructor(private readonly auditService: V2AuditService) {}

  @Get()
  async getAnnouncements(@V2Context() context: ApiV2Context) {
    if (!this.hasScope(context, 'announcements:read')) {
      throw new ForbiddenException('Forbidden: Missing announcements:read scope');
    }

    const announcements = await prisma.departmentAnnouncement.findMany({
      where: {
        department: { workspaceId: context.workspaceId },
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        department: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    await this.auditService.log(context, 'announcements.list', 'announcement');

    return { announcements };
  }

  @Post()
  async createAnnouncement(@V2Context() context: ApiV2Context, @Body() body: any) {
    if (!this.hasScope(context, 'announcements:write')) {
      throw new ForbiddenException('Forbidden: Missing announcements:write scope');
    }

    const validatedData = createAnnouncementSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }

    const { departmentId, ...data } = validatedData.data;

    // Verify department belongs to workspace
    const department = await prisma.workspaceDepartment.findFirst({
      where: { id: departmentId, workspaceId: context.workspaceId },
    });

    if (!department) {
      throw new NotFoundException('Department not found in this workspace');
    }

    const announcement = await prisma.departmentAnnouncement.create({
      data: {
        ...data,
        departmentId,
        authorId: context.userId,
        publishAt: data.publishAt ? new Date(data.publishAt) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        targetAudience: data.targetAudience as any,
        attachments: data.attachments as any,
      },
    });

    await this.auditService.log(context, 'announcements.create', 'announcement', announcement.id, validatedData.data);

    return { announcement };
  }

  @Get(':announcementId')
  async getAnnouncement(@V2Context() context: ApiV2Context, @Param('announcementId') announcementId: string) {
    if (!this.hasScope(context, 'announcements:read')) {
      throw new ForbiddenException('Forbidden: Missing announcements:read scope');
    }

    const announcement = await prisma.departmentAnnouncement.findFirst({
      where: {
        id: announcementId,
        department: { workspaceId: context.workspaceId },
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        department: true,
      },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    await this.auditService.log(context, 'announcements.get', 'announcement', announcementId);

    return { announcement };
  }

  @Patch(':announcementId')
  async updateAnnouncement(
    @V2Context() context: ApiV2Context,
    @Param('announcementId') announcementId: string,
    @Body() body: any
  ) {
    if (!this.hasScope(context, 'announcements:write')) {
      throw new ForbiddenException('Forbidden: Missing announcements:write scope');
    }

    const validatedData = updateAnnouncementSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }

    const announcement = await prisma.departmentAnnouncement.update({
      where: {
        id: announcementId,
        department: { workspaceId: context.workspaceId },
      },
      data: {
        ...validatedData.data,
        publishAt: validatedData.data.publishAt ? new Date(validatedData.data.publishAt) : undefined,
        expiresAt: validatedData.data.expiresAt ? new Date(validatedData.data.expiresAt) : undefined,
        targetAudience: validatedData.data.targetAudience as any,
        attachments: validatedData.data.attachments as any,
      },
    });

    await this.auditService.log(context, 'announcements.update', 'announcement', announcementId, validatedData.data);

    return { announcement };
  }

  @Delete(':announcementId')
  async deleteAnnouncement(@V2Context() context: ApiV2Context, @Param('announcementId') announcementId: string) {
    if (!this.hasScope(context, 'announcements:write')) {
      throw new ForbiddenException('Forbidden: Missing announcements:write scope');
    }

    await prisma.departmentAnnouncement.delete({
      where: {
        id: announcementId,
        department: { workspaceId: context.workspaceId },
      },
    });

    await this.auditService.log(context, 'announcements.delete', 'announcement', announcementId);

    return { success: true };
  }

  private hasScope(context: ApiV2Context, scope: string): boolean {
    return context.scopes.includes(scope) || context.scopes.includes('*');
  }
}

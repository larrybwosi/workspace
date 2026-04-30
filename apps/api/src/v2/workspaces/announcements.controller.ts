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

class CreateAnnouncementDto {
  @ApiProperty({ example: 'dept_123' })
  departmentId: string;
  @ApiProperty({ example: 'New Policy' })
  title: string;
  @ApiProperty({ example: 'The new policy is...' })
  content: string;
  @ApiProperty({ enum: ['low', 'normal', 'high', 'urgent'], default: 'normal', required: false })
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  @ApiProperty({ default: false, required: false })
  pinned?: boolean;
  @ApiProperty({ required: false, description: 'ISO string date' })
  publishAt?: string;
  @ApiProperty({ required: false, description: 'ISO string date' })
  expiresAt?: string;
  @ApiProperty({ required: false })
  targetAudience?: Record<string, any>;
  @ApiProperty({ required: false, type: 'array', items: { type: 'object' } })
  attachments?: any[];
}

class UpdateAnnouncementDto {
  @ApiProperty({ required: false })
  departmentId?: string;
  @ApiProperty({ required: false })
  title?: string;
  @ApiProperty({ required: false })
  content?: string;
  @ApiProperty({ enum: ['low', 'normal', 'high', 'urgent'], required: false })
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  @ApiProperty({ required: false })
  pinned?: boolean;
  @ApiProperty({ required: false })
  publishAt?: string;
  @ApiProperty({ required: false })
  expiresAt?: string;
  @ApiProperty({ required: false })
  targetAudience?: Record<string, any>;
  @ApiProperty({ required: false, type: 'array', items: { type: 'object' } })
  attachments?: any[];
}

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

@ApiTags('Announcements')
@ApiBearerAuth()
@Controller('v2/workspaces/:slug/announcements')
@UseGuards(ApiV2Guard)
export class V2AnnouncementsController {
  constructor(private readonly auditService: V2AuditService) {}

  @Get()
  @ApiOperation({ summary: 'List all announcements in the workspace', description: 'Requires announcements:read scope.' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiResponse({ status: 200, description: 'List of announcements returned successfully.' })
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
  @ApiOperation({ summary: 'Create a new announcement', description: 'Requires announcements:write scope.' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiBody({ type: CreateAnnouncementDto })
  @ApiResponse({ status: 201, description: 'Announcement created successfully.' })
  async createAnnouncement(@V2Context() context: ApiV2Context, @Body() body: CreateAnnouncementDto) {
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
  @ApiOperation({ summary: 'Get details of a specific announcement', description: 'Requires announcements:read scope.' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'announcementId', description: 'The announcement ID' })
  @ApiResponse({ status: 200, description: 'Announcement details returned successfully.' })
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
  @ApiOperation({ summary: 'Update an announcement', description: 'Requires announcements:write scope.' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'announcementId', description: 'The announcement ID' })
  @ApiBody({ type: UpdateAnnouncementDto })
  @ApiResponse({ status: 200, description: 'Announcement updated successfully.' })
  async updateAnnouncement(
    @V2Context() context: ApiV2Context,
    @Param('announcementId') announcementId: string,
    @Body() body: UpdateAnnouncementDto
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
  @ApiOperation({ summary: 'Delete an announcement', description: 'Requires announcements:write scope.' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'announcementId', description: 'The announcement ID' })
  @ApiResponse({ status: 200, description: 'Announcement deleted successfully.' })
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

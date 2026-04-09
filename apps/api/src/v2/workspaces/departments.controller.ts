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

const createDepartmentSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  parentId: z.string().optional(),
  managerId: z.string().optional(),
});

const updateDepartmentSchema = createDepartmentSchema.partial();

@Controller('v2/workspaces/:slug/departments')
@UseGuards(ApiV2Guard)
export class V2DepartmentsController {
  constructor(private readonly auditService: V2AuditService) {}

  @Get()
  async getDepartments(@V2Context() context: ApiV2Context) {
    if (!this.hasScope(context, 'departments:read')) {
      throw new ForbiddenException('Forbidden: Missing departments:read scope');
    }

    const departments = await prisma.workspaceDepartment.findMany({
      where: { workspaceId: context.workspaceId },
      include: {
        manager: { select: { id: true, name: true, avatar: true } },
        _count: { select: { members: true, teams: true, channels: true } },
      },
    });

    await this.auditService.log(context, 'departments.list', 'department');

    return { departments };
  }

  @Post()
  async createDepartment(@V2Context() context: ApiV2Context, @Body() body: any) {
    if (!this.hasScope(context, 'departments:write')) {
      throw new ForbiddenException('Forbidden: Missing departments:write scope');
    }

    const validatedData = createDepartmentSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }

    const department = await prisma.workspaceDepartment.create({
      data: {
        ...validatedData.data,
        workspaceId: context.workspaceId!,
      },
    });

    await this.auditService.log(context, 'departments.create', 'department', department.id, validatedData.data);

    return { department };
  }

  @Get(':departmentId')
  async getDepartment(@V2Context() context: ApiV2Context, @Param('departmentId') departmentId: string) {
    if (!this.hasScope(context, 'departments:read')) {
      throw new ForbiddenException('Forbidden: Missing departments:read scope');
    }

    const department = await prisma.workspaceDepartment.findFirst({
      where: { id: departmentId, workspaceId: context.workspaceId },
      include: {
        manager: { select: { id: true, name: true, avatar: true } },
        parent: true,
        children: true,
        teams: true,
        members: { include: { user: { select: { id: true, name: true, avatar: true } } } },
      },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    await this.auditService.log(context, 'departments.get', 'department', departmentId);

    return { department };
  }

  @Patch(':departmentId')
  async updateDepartment(
    @V2Context() context: ApiV2Context,
    @Param('departmentId') departmentId: string,
    @Body() body: any
  ) {
    if (!this.hasScope(context, 'departments:write')) {
      throw new ForbiddenException('Forbidden: Missing departments:write scope');
    }

    const validatedData = updateDepartmentSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }

    const department = await prisma.workspaceDepartment.update({
      where: { id: departmentId, workspaceId: context.workspaceId },
      data: validatedData.data,
    });

    await this.auditService.log(context, 'departments.update', 'department', departmentId, validatedData.data);

    return { department };
  }

  @Delete(':departmentId')
  async deleteDepartment(@V2Context() context: ApiV2Context, @Param('departmentId') departmentId: string) {
    if (!this.hasScope(context, 'departments:write')) {
      throw new ForbiddenException('Forbidden: Missing departments:write scope');
    }

    await prisma.workspaceDepartment.delete({
      where: { id: departmentId, workspaceId: context.workspaceId },
    });

    await this.auditService.log(context, 'departments.delete', 'department', departmentId);

    return { success: true };
  }

  private hasScope(context: ApiV2Context, scope: string): boolean {
    return context.scopes.includes(scope) || context.scopes.includes('*');
  }
}

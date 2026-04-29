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

class CreateDepartmentDto {
  @ApiProperty({ example: 'Product' })
  name: string;
  @ApiProperty({ example: 'product' })
  slug: string;
  @ApiProperty({ required: false })
  description?: string;
  @ApiProperty({ required: false })
  icon?: string;
  @ApiProperty({ required: false })
  color?: string;
  @ApiProperty({ required: false })
  parentId?: string;
  @ApiProperty({ required: false })
  managerId?: string;
}

class UpdateDepartmentDto {
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
  parentId?: string;
  @ApiProperty({ required: false })
  managerId?: string;
}

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

@ApiTags('Departments')
@ApiBearerAuth()
@Controller('v2/workspaces/:slug/departments')
@UseGuards(ApiV2Guard)
export class V2DepartmentsController {
  constructor(private readonly auditService: V2AuditService) {}

  @Get()
  @ApiOperation({ summary: 'List all departments in the workspace', description: 'Requires departments:read scope.' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiResponse({ status: 200, description: 'List of departments returned successfully.' })
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
  @ApiOperation({ summary: 'Create a new department', description: 'Requires departments:write scope.' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiBody({ type: CreateDepartmentDto })
  @ApiResponse({ status: 201, description: 'Department created successfully.' })
  async createDepartment(@V2Context() context: ApiV2Context, @Body() body: CreateDepartmentDto) {
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
  @ApiOperation({ summary: 'Get details of a specific department', description: 'Requires departments:read scope.' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'departmentId', description: 'The department ID' })
  @ApiResponse({ status: 200, description: 'Department details returned successfully.' })
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
  @ApiOperation({ summary: 'Update a department', description: 'Requires departments:write scope.' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'departmentId', description: 'The department ID' })
  @ApiBody({ type: UpdateDepartmentDto })
  @ApiResponse({ status: 200, description: 'Department updated successfully.' })
  async updateDepartment(
    @V2Context() context: ApiV2Context,
    @Param('departmentId') departmentId: string,
    @Body() body: UpdateDepartmentDto
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
  @ApiOperation({ summary: 'Delete a department', description: 'Requires departments:write scope.' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'departmentId', description: 'The department ID' })
  @ApiResponse({ status: 200, description: 'Department deleted successfully.' })
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

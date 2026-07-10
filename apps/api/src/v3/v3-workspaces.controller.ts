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
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiProperty, ApiParam } from '@nestjs/swagger';
import { ApiV3Guard, ApiV3Context } from '../auth/api-v3.guard';
import { V3Context } from '../auth/v3-context.decorator';
import { ProvisioningService } from '../v2/provisioning.service';
import { prisma } from '@repo/database';
import { z } from 'zod';
import { IsString, IsOptional, IsEmail, IsArray } from 'class-validator';

export class V3UpdateWorkspaceDto {
  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'Acme Corp Updated', required: false, description: 'The display name of the workspace' })
  name?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'building', required: false, description: 'Icon identifier or URL' })
  icon?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'Updated description for Acme Corp', required: false, description: 'A description for the workspace.' })
  description?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'Technology', required: false, description: 'The industry categorization of the workspace.' })
  industry?: string;

  @IsOptional()
  @ApiProperty({ required: false, description: 'Custom branding configuration' })
  brandingConfig?: any;
}

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  icon: z.string().optional(),
  description: z.string().optional(),
  industry: z.string().optional(),
  brandingConfig: z.any().optional(),
});

export class V3ProvisionWorkspaceDto {
  @IsString()
  @ApiProperty({ example: 'Acme Corp', description: 'The display name of the workspace' })
  name: string;

  @IsString()
  @ApiProperty({ example: 'acme-corp', description: 'Unique slug for the workspace URL' })
  slug: string;

  @IsEmail()
  @ApiProperty({ example: 'admin@acme.com', description: 'The email of the workspace owner. Must exist in the organization.' })
  ownerEmail: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'Technology', required: false, description: 'The industry categorization of the workspace.' })
  industry?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'Primary workspace for Acme Corp teams', required: false, description: 'A description for the workspace.' })
  description?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'building', required: false, description: 'Icon identifier' })
  icon?: string;

  @IsOptional()
  @ApiProperty({ required: false, description: 'Custom branding configuration' })
  brandingConfig?: any;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ApiProperty({ example: ['general', 'engineering'], required: false, description: 'Initial channels to create' })
  channels?: string[];

  @IsArray()
  @IsOptional()
  @ApiProperty({
    required: false,
    description: 'Initial members to add to the workspace',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@acme.com' },
        role: { type: 'string', example: 'member', enum: ['admin', 'member'] },
      },
    },
  })
  initialMembers?: { email: string; role: string }[];
}

const provisionSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  ownerEmail: z.string().email(),
  industry: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional().default('building'),
  brandingConfig: z.any().optional(),
  channels: z.array(z.string()).optional().default(['general', 'random']),
  initialMembers: z
    .array(
      z.object({
        email: z.string().email(),
        role: z.string().default('member'),
      })
    )
    .optional()
    .default([]),
});

@ApiTags('V3 Workspaces')
@ApiBearerAuth()
@Controller('v3/workspaces')
@UseGuards(ApiV3Guard)
export class V3WorkspacesController {
  constructor(private readonly provisioningService: ProvisioningService) {}

  private formatResponse<T>(data: T) {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @ApiOperation({
    summary: 'List organization workspaces (Enterprise M2M)',
    description: 'Retrieve all workspaces associated with the authenticated organization or workspace context.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of workspaces returned successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            workspaces: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  slug: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  createdAt: { type: 'string' },
                },
              },
            },
          },
        },
        timestamp: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden: Missing provisioning:workspaces scope' })
  async getWorkspaces(@V3Context() context: ApiV3Context) {
    if (!context.scopes.includes('provisioning:workspaces') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Missing provisioning:workspaces scope');
    }

    let workspaces: any[] = [];
    if (context.organizationId) {
      workspaces = await prisma.workspace.findMany({
        where: { organizationId: context.organizationId },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          createdAt: true,
        },
      });
    } else if (context.workspaceId) {
      const workspace = await prisma.workspace.findUnique({
        where: { id: context.workspaceId },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          createdAt: true,
        },
      });
      if (workspace) workspaces.push(workspace);
    }

    return this.formatResponse({ workspaces });
  }

  @Post()
  @ApiOperation({
    summary: 'Provision a new workspace (Enterprise M2M)',
    description: `
Provisions a new workspace within your organization.
When provisioned via M2M:
1. A **System Bot** (Default Bot) is automatically created with admin privileges for the workspace.
2. Your M2M application is installed as an **Administrator** in the new workspace.
3. The specified owner and initial members are added.
    `,
  })
  @ApiBody({ type: V3ProvisionWorkspaceDto })
  @ApiResponse({
    status: 201,
    description: 'Workspace provisioned successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            workspace: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                slug: { type: 'string' },
                name: { type: 'string' },
              },
            },
            bot: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                clientId: { type: 'string' },
                clientSecret: { type: 'string' },
              },
            },
          },
        },
        timestamp: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input or owner not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden: Missing provisioning:workspaces scope.' })
  async provisionWorkspace(@V3Context() context: ApiV3Context, @Body() body: V3ProvisionWorkspaceDto) {
    if (!context.scopes.includes('provisioning:workspaces') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Missing provisioning:workspaces scope');
    }

    const validatedData = provisionSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }

    const result = await this.provisioningService.provisionWorkspace(context, validatedData.data);
    return this.formatResponse({
      workspace: result.workspace,
      bot: result.bot,
    });
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Get workspace details (Enterprise M2M)',
    description: 'Retrieve details of a specific workspace by its slug.',
  })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiResponse({
    status: 200,
    description: 'Workspace details returned successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            workspace: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                slug: { type: 'string' },
                description: { type: 'string', nullable: true },
                icon: { type: 'string', nullable: true },
                industry: { type: 'string', nullable: true },
                brandingConfig: { type: 'object', nullable: true },
                createdAt: { type: 'string' },
              },
            },
          },
        },
        timestamp: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden: Missing provisioning:workspaces scope or unauthorized workspace access.' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async getWorkspaceBySlug(@V3Context() context: ApiV3Context, @Param('slug') slug: string) {
    if (!context.scopes.includes('provisioning:workspaces') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Missing provisioning:workspaces scope');
    }

    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        icon: true,
        industry: true,
        brandingConfig: true,
        organizationId: true,
        createdAt: true,
      },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace with slug "${slug}" not found`);
    }

    // Security validation
    if (context.organizationId) {
      if (workspace.organizationId !== context.organizationId) {
        throw new ForbiddenException('M2M application is not authorized to access this workspace');
      }
    } else if (context.workspaceId) {
      if (workspace.id !== context.workspaceId) {
        throw new ForbiddenException('Token is not authorized for this workspace');
      }
    } else {
      const member = await prisma.workspaceMember.findFirst({
        where: { workspaceId: workspace.id, userId: context.userId },
      });
      if (!member) {
        throw new ForbiddenException('You are not a member of this workspace');
      }
    }

    // Exclude organizationId from response for security
    const { organizationId, ...workspaceData } = workspace;

    return this.formatResponse({ workspace: workspaceData });
  }

  @Patch(':slug')
  @ApiOperation({
    summary: 'Update a workspace (Enterprise M2M)',
    description: 'Update the configuration and metadata of a specific workspace.',
  })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiBody({ type: V3UpdateWorkspaceDto })
  @ApiResponse({
    status: 200,
    description: 'Workspace updated successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            workspace: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                slug: { type: 'string' },
                description: { type: 'string', nullable: true },
                icon: { type: 'string', nullable: true },
                industry: { type: 'string', nullable: true },
                brandingConfig: { type: 'object', nullable: true },
                updatedAt: { type: 'string' },
              },
            },
          },
        },
        timestamp: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden: Missing provisioning:workspaces scope or unauthorized access.' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async updateWorkspace(
    @V3Context() context: ApiV3Context,
    @Param('slug') slug: string,
    @Body() body: V3UpdateWorkspaceDto
  ) {
    if (!context.scopes.includes('provisioning:workspaces') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Missing provisioning:workspaces scope');
    }

    const validatedData = updateSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }

    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      select: { id: true, organizationId: true },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace with slug "${slug}" not found`);
    }

    // Security validation
    if (context.organizationId) {
      if (workspace.organizationId !== context.organizationId) {
        throw new ForbiddenException('M2M application is not authorized to access this workspace');
      }
    } else if (context.workspaceId) {
      if (workspace.id !== context.workspaceId) {
        throw new ForbiddenException('Token is not authorized for this workspace');
      }
    } else {
      const member = await prisma.workspaceMember.findFirst({
        where: { workspaceId: workspace.id, userId: context.userId },
      });
      if (!member || !['owner', 'admin'].includes(member.role)) {
        throw new ForbiddenException('You do not have permission to update this workspace');
      }
    }

    const updatedWorkspace = await prisma.workspace.update({
      where: { id: workspace.id },
      data: validatedData.data,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        icon: true,
        industry: true,
        brandingConfig: true,
        updatedAt: true,
      },
    });

    // Write audit log
    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId: workspace.id,
        userId: context.userId,
        action: 'workspace.updated',
        resource: 'workspace',
        resourceId: workspace.id,
        metadata: {
          updater: context.clientId,
          changes: validatedData.data,
        } as any,
      },
    });

    return this.formatResponse({ workspace: updatedWorkspace });
  }

  @Delete(':slug')
  @ApiOperation({
    summary: 'Delete a workspace (Enterprise M2M)',
    description: 'Permanently deletes a specific workspace.',
  })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiResponse({
    status: 200,
    description: 'Workspace deleted successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
          },
        },
        timestamp: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden: Missing provisioning:workspaces scope or unauthorized access.' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async deleteWorkspace(@V3Context() context: ApiV3Context, @Param('slug') slug: string) {
    if (!context.scopes.includes('provisioning:workspaces') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Missing provisioning:workspaces scope');
    }

    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      select: { id: true, organizationId: true, ownerId: true },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace with slug "${slug}" not found`);
    }

    // Security validation
    if (context.organizationId) {
      if (workspace.organizationId !== context.organizationId) {
        throw new ForbiddenException('M2M application is not authorized to access this workspace');
      }
    } else if (context.workspaceId) {
      if (workspace.id !== context.workspaceId) {
        throw new ForbiddenException('Token is not authorized for this workspace');
      }
    } else {
      if (workspace.ownerId !== context.userId) {
        throw new ForbiddenException('Only the owner can delete the workspace');
      }
    }

    await prisma.workspace.delete({
      where: { id: workspace.id },
    });

    return this.formatResponse({ success: true });
  }
}

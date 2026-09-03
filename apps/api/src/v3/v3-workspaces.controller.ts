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
  Inject,
  Logger,
  UseFilters,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiProperty, ApiParam } from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { V3ExceptionFilter } from './v3-exception.filter';
import { ApiV3Guard, ApiV3Context } from '../auth/api-v3.guard';
import { V3Context } from '../auth/v3-context.decorator';
import { ProvisioningService } from '../provisioning/provisioning.service';
import { prisma } from '@repo/database';
import { z } from 'zod';
import { IsString, IsOptional, IsEmail, IsArray, IsEnum } from 'class-validator';
import Redis from 'ioredis';

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

export class V3AddMemberDto {
  @IsEmail()
  @IsOptional()
  @ApiProperty({ example: 'user@example.com', description: 'The email of the user to add', required: false })
  email?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'usr_123', description: 'The user ID of the user to add', required: false })
  userId?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'wsm_123', description: 'The workspace member ID of the user to add', required: false })
  memberId?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'member', description: 'The role of the member', required: false, default: 'member' })
  role?: string;
}

const addMemberSchema = z
  .object({
    email: z.string().email().optional(),
    userId: z.string().optional(),
    memberId: z.string().optional(),
    role: z.string().optional().default('member'),
  })
  .refine(data => Boolean(data.email || data.userId || data.memberId), {
    message: 'At least one of email, userId, or memberId must be provided',
  });

export class V3UpdateMemberRoleDto {
  @IsEnum(['owner', 'admin', 'moderator', 'member', 'guest'])
  @ApiProperty({ enum: ['owner', 'admin', 'moderator', 'member', 'guest'], example: 'admin' })
  role: 'owner' | 'admin' | 'moderator' | 'member' | 'guest';
}

const updateMemberSchema = z.object({
  role: z.enum(['owner', 'admin', 'moderator', 'member', 'guest']),
});

export class V3CreateChannelDto {
  @IsString()
  @ApiProperty({ example: 'engineering', description: 'Name of the channel' })
  name: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'Engineering discussion channel', required: false })
  description?: string;

  @IsEnum(['public', 'private'])
  @IsOptional()
  @ApiProperty({ example: 'public', enum: ['public', 'private'], required: false, default: 'public' })
  type?: 'public' | 'private';

  @IsOptional()
  @ApiProperty({ example: false, required: false, description: 'Explicit private status flag' })
  isPrivate?: boolean;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'code', required: false, description: 'Icon identifier' })
  icon?: string;

  @IsOptional()
  @ApiProperty({ required: false, description: 'Custom channel metadata' })
  metadata?: any;

  @IsArray()
  @IsOptional()
  @ApiProperty({
    required: false,
    description: 'Initial members to add to the channel',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        userId: { type: 'string', example: 'usr_123' },
        role: { type: 'string', example: 'member', enum: ['admin', 'moderator', 'member'] },
        permissions: { type: 'string', example: '2048' },
      },
    },
  })
  initialMembers?: { userId: string; role?: string; permissions?: string }[];
}

const v3CreateChannelSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  type: z.enum(['public', 'private']).optional(),
  isPrivate: z.boolean().optional(),
  icon: z.string().optional().default('#'),
  metadata: z.any().optional(),
  initialMembers: z
    .array(
      z.object({
        userId: z.string().min(1),
        role: z.string().optional().default('member'),
        permissions: z.union([z.string(), z.number()]).optional(),
      })
    )
    .optional()
    .default([]),
});

export class V3UpdateChannelDto {
  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'eng-tech', required: false })
  name?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'Updated engineering channel description', required: false })
  description?: string;

  @IsEnum(['public', 'private'])
  @IsOptional()
  @ApiProperty({ example: 'private', enum: ['public', 'private'], required: false })
  type?: 'public' | 'private';

  @IsOptional()
  @ApiProperty({ example: true, required: false })
  isPrivate?: boolean;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'terminal', required: false })
  icon?: string;

  @IsOptional()
  @ApiProperty({ required: false })
  metadata?: any;
}

const v3UpdateChannelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  type: z.enum(['public', 'private']).optional(),
  isPrivate: z.boolean().optional(),
  icon: z.string().optional(),
  metadata: z.any().optional(),
});

export class V3AddChannelMemberDto {
  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'usr_123', required: false, description: 'User ID, Member ID, or Email to add to channel' })
  userId?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'wsm_123', required: false, description: 'Workspace member ID to add to channel' })
  memberId?: string;

  @IsEmail()
  @IsOptional()
  @ApiProperty({ example: 'user@example.com', required: false, description: 'Email address of user to add to channel' })
  email?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ApiProperty({ example: ['usr_123', 'user@example.com'], required: false, description: 'Array of user IDs, member IDs, or emails to add' })
  userIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ApiProperty({ example: ['wsm_123', 'wsm_456'], required: false, description: 'Array of workspace member IDs to add' })
  memberIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ApiProperty({ example: ['user1@example.com', 'user2@example.com'], required: false, description: 'Array of user emails to add' })
  emails?: string[];

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'member', required: false, default: 'member', description: 'Channel role' })
  role?: string;

  @IsOptional()
  @ApiProperty({ example: '2048', required: false, description: 'Bitwise permission string or integer value' })
  permissions?: string | number;
}

const v3AddChannelMemberSchema = z.object({
  userId: z.string().optional(),
  memberId: z.string().optional(),
  email: z.string().optional(),
  userIds: z.array(z.string()).optional(),
  memberIds: z.array(z.string()).optional(),
  emails: z.array(z.string()).optional(),
  role: z.string().optional().default('member'),
  permissions: z.union([z.string(), z.number()]).optional(),
});

export class V3UpdateChannelMemberDto {
  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'admin', required: false, enum: ['admin', 'moderator', 'member'] })
  role?: string;

  @IsOptional()
  @ApiProperty({ example: '2048', required: false, description: 'Bitwise permission string or integer value' })
  permissions?: string | number;
}

const v3UpdateChannelMemberSchema = z.object({
  role: z.string().optional(),
  permissions: z.union([z.string(), z.number()]).optional(),
});

@ApiTags('V3 Workspaces')
@ApiBearerAuth()
@AllowAnonymous()
@Controller('v3/workspaces')
@UseGuards(ApiV3Guard)
@UseFilters(V3ExceptionFilter)
export class V3WorkspacesController {
  private readonly logger = new Logger(V3WorkspacesController.name);

  constructor(
    private readonly provisioningService: ProvisioningService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis
  ) {}

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

    let cacheKey = '';
    if (context.organizationId) {
      cacheKey = `v3:org:${context.organizationId}:workspaces`;
    } else if (context.workspaceId) {
      cacheKey = `v3:ws:${context.workspaceId}:workspaces`;
    }

    if (cacheKey) {
      try {
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          return this.formatResponse({ workspaces: JSON.parse(cached) });
        }
      } catch (err) {
        this.logger.warn('Redis error in getWorkspaces (get):', err);
      }
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

    if (cacheKey && workspaces.length > 0) {
      try {
        await this.redis.setex(cacheKey, 600, JSON.stringify(workspaces));
      } catch (err) {
        this.logger.warn('Redis error in getWorkspaces (setex):', err);
      }
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

    // Invalidate list caches
    if (context.organizationId) {
      try {
        await this.redis.del(`v3:org:${context.organizationId}:workspaces`);
      } catch (err) {
        this.logger.warn('Redis error in provisionWorkspace (del):', err);
      }
    }

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

    const cacheKey = `v3:workspace:slug:${slug}`;
    let workspace: any = null;

    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        workspace = JSON.parse(cached);
      }
    } catch (err) {
      this.logger.warn('Redis error in getWorkspaceBySlug (get):', err);
    }

    if (!workspace) {
      workspace = await prisma.workspace.findUnique({
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

      try {
        await this.redis.setex(cacheKey, 600, JSON.stringify(workspace));
      } catch (err) {
        this.logger.warn('Redis error in getWorkspaceBySlug (setex):', err);
      }
    }

    // Security validation
    if (context.organizationId) {
      if (workspace.organizationId !== context.organizationId) {
        const orgWithMember = await prisma.organization.findUnique({
          where: { id: context.organizationId },
          select: {
            members: {
              where: { userId: workspace.ownerId },
              select: { id: true },
            },
          },
        });
        const hasOwnerAccess = orgWithMember && orgWithMember.members.length > 0;
        if (!hasOwnerAccess) {
          throw new ForbiddenException('M2M application is not authorized to access this workspace');
        }
      }
    } else if (context.workspaceId) {
      if (workspace.id !== context.workspaceId) {
        throw new ForbiddenException('Token is not authorized for this workspace');
      }
    } else {
      const member = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: workspace.id,
            userId: context.userId!,
          },
        },
        select: { id: true },
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
      select: { id: true, organizationId: true, ownerId: true },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace with slug "${slug}" not found`);
    }

    // Security validation
    if (context.organizationId) {
      if (workspace.organizationId !== context.organizationId) {
        const orgWithMember = await prisma.organization.findUnique({
          where: { id: context.organizationId },
          select: {
            members: {
              where: { userId: workspace.ownerId },
              select: { id: true },
            },
          },
        });
        const hasOwnerAccess = orgWithMember && orgWithMember.members.length > 0;
        if (!hasOwnerAccess) {
          throw new ForbiddenException('M2M application is not authorized to access this workspace');
        }
      }
    } else if (context.workspaceId) {
      if (workspace.id !== context.workspaceId) {
        throw new ForbiddenException('Token is not authorized for this workspace');
      }
    } else {
      const member = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: workspace.id,
            userId: context.userId!,
          },
        },
        select: { id: true, role: true },
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

    // Invalidate caches
    try {
      const pipeline = this.redis.pipeline();
      pipeline.del(`v3:workspace:slug:${slug}`);
      if (workspace.organizationId) {
        pipeline.del(`v3:org:${workspace.organizationId}:workspaces`);
      }
      pipeline.del(`v3:ws:${workspace.id}:workspaces`);
      await pipeline.exec();
    } catch (err) {
      this.logger.warn('Redis error in updateWorkspace (del):', err);
    }

    prisma.workspaceAuditLog
      .create({
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
      })
      .catch((err) => this.logger.error('Audit log error in updateWorkspace:', err));

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
        const orgWithMember = await prisma.organization.findUnique({
          where: { id: context.organizationId },
          select: {
            members: {
              where: { userId: workspace.ownerId },
              select: { id: true },
            },
          },
        });
        const hasOwnerAccess = orgWithMember && orgWithMember.members.length > 0;
        if (!hasOwnerAccess) {
          throw new ForbiddenException('M2M application is not authorized to access this workspace');
        }
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

    // Invalidate caches
    try {
      const pipeline = this.redis.pipeline();
      pipeline.del(`v3:workspace:slug:${slug}`);
      if (workspace.organizationId) {
        pipeline.del(`v3:org:${workspace.organizationId}:workspaces`);
      }
      pipeline.del(`v3:ws:${workspace.id}:workspaces`);
      await pipeline.exec();
    } catch (err) {
      this.logger.warn('Redis error in deleteWorkspace (del):', err);
    }

    return this.formatResponse({ success: true });
  }

  @Get(':slug/members')
  @ApiOperation({
    summary: 'List all workspace members (Enterprise M2M)',
    description: 'Retrieve all members of a specific workspace. Requires members:read scope.',
  })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiResponse({ status: 200, description: 'List of members returned successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden: Missing scope or unauthorized.' })
  async getWorkspaceMembers(@V3Context() context: ApiV3Context, @Param('slug') slug: string) {
    if (!context.scopes.includes('members:read') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Missing members:read scope');
    }

    const workspaceId = context.workspaceId;
    if (!workspaceId) {
      throw new BadRequestException('Workspace context is missing');
    }

    const cacheKey = `v3:members:${workspaceId}`;
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return this.formatResponse({ members: JSON.parse(cached) });
      }
    } catch (err) {
      this.logger.warn('Redis error in getWorkspaceMembers (get):', err);
    }

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      select: {
        id: true,
        workspaceId: true,
        userId: true,
        departmentId: true,
        role: true,
        memberType: true,
        joinedAt: true,
        notificationPreference: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            status: true,
          },
        },
      },
    });

    try {
      await this.redis.setex(cacheKey, 600, JSON.stringify(members));
    } catch (err) {
      this.logger.warn('Redis error in getWorkspaceMembers (setex):', err);
    }

    return this.formatResponse({ members });
  }

  @Post(':slug/members')
  @ApiOperation({
    summary: 'Add a member to the workspace (Enterprise M2M)',
    description: 'Add a new member to a specific workspace using user email, user ID, or workspace member ID. Requires members:write scope.',
  })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiBody({ type: V3AddMemberDto })
  @ApiResponse({ status: 201, description: 'Member added successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden: Missing scope or unauthorized.' })
  async addWorkspaceMember(
    @V3Context() context: ApiV3Context,
    @Param('slug') slug: string,
    @Body() body: V3AddMemberDto
  ) {
    if (!context.scopes.includes('members:write') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Missing members:write scope');
    }

    const workspaceId = context.workspaceId;
    if (!workspaceId) {
      throw new BadRequestException('Workspace context is missing');
    }

    const validatedData = addMemberSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }

    const { email, userId, memberId, role } = validatedData.data;

    let targetUserId: string | null = null;
    let targetEmail: string | null = null;

    if (userId) {
      targetUserId = userId;
    } else if (email) {
      targetEmail = email;
    } else if (memberId) {
      const existingWsm = await prisma.workspaceMember.findUnique({
        where: { id: memberId },
        select: { userId: true },
      });
      if (existingWsm) {
        targetUserId = existingWsm.userId;
      } else {
        const user = await prisma.user.findFirst({
          where: { OR: [{ id: memberId }, { email: memberId }] },
          select: { id: true },
        });
        if (!user) {
          throw new NotFoundException('User not found');
        }
        targetUserId = user.id;
      }
    }

    try {
      const membership = await prisma.workspaceMember.create({
        data: {
          workspace: {
            connect: { id: workspaceId },
          },
          role,
          user: targetUserId
            ? { connect: { id: targetUserId } }
            : { connect: { email: targetEmail! } },
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Invalidate caches
      try {
        await this.redis.del(`v3:members:${workspaceId}`);
        await this.redis.del(`v2:members:${workspaceId}`);
      } catch (err) {
        this.logger.warn('Redis error in addWorkspaceMember (del):', err);
      }

      return this.formatResponse({ member: membership });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      if (error.code === 'P2002') {
        throw new BadRequestException('User is already a member of this workspace');
      }
      throw error;
    }
  }

  @Get(':slug/members/:memberId')
  @ApiOperation({
    summary: 'Get details of a specific workspace member (Enterprise M2M)',
    description: 'Retrieve details of a specific workspace member by member ID, user ID, or user email address. Requires members:read scope.',
  })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'memberId', description: 'The workspace member ID, user ID, or user email address' })
  @ApiResponse({ status: 200, description: 'Member details returned successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden: Missing scope or unauthorized.' })
  @ApiResponse({ status: 404, description: 'Member not found.' })
  async getWorkspaceMember(
    @V3Context() context: ApiV3Context,
    @Param('slug') slug: string,
    @Param('memberId') memberIdParam: string
  ) {
    if (!context.scopes.includes('members:read') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Missing members:read scope');
    }

    const workspaceId = context.workspaceId;
    if (!workspaceId) {
      throw new BadRequestException('Workspace context is missing');
    }

    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        OR: [
          { id: memberIdParam },
          { userId: memberIdParam },
          { user: { email: memberIdParam } },
        ],
      },
      select: {
        id: true,
        workspaceId: true,
        userId: true,
        departmentId: true,
        role: true,
        memberType: true,
        joinedAt: true,
        notificationPreference: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            status: true,
            role: true,
          },
        },
        department: { select: { id: true, name: true } },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found in this workspace');
    }

    return this.formatResponse({ member });
  }

  @Patch(':slug/members/:memberId')
  @ApiOperation({
    summary: 'Update a workspace member role (Enterprise M2M)',
    description: 'Update the role of a specific workspace member by member ID, user ID, or user email address. Requires members:write scope.',
  })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'memberId', description: 'The workspace member ID, user ID, or user email address' })
  @ApiBody({ type: V3UpdateMemberRoleDto })
  @ApiResponse({ status: 200, description: 'Member updated successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden: Missing scope or unauthorized.' })
  async updateWorkspaceMember(
    @V3Context() context: ApiV3Context,
    @Param('slug') slug: string,
    @Param('memberId') memberIdParam: string,
    @Body() body: V3UpdateMemberRoleDto
  ) {
    if (!context.scopes.includes('members:write') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Missing members:write scope');
    }

    const workspaceId = context.workspaceId;
    if (!workspaceId) {
      throw new BadRequestException('Workspace context is missing');
    }

    const validatedData = updateMemberSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }
    const { role } = validatedData.data;

    const existingMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        OR: [
          { id: memberIdParam },
          { userId: memberIdParam },
          { user: { email: memberIdParam } },
        ],
      },
      select: { id: true },
    });

    if (!existingMember) {
      throw new NotFoundException('Member not found in this workspace');
    }

    try {
      const updatedMember = await prisma.workspaceMember.update({
        where: { id: existingMember.id },
        data: { role },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      });

      // Invalidate caches
      try {
        await this.redis.del(`v3:members:${workspaceId}`);
        await this.redis.del(`v2:members:${workspaceId}`);
      } catch (err) {
        this.logger.warn('Redis error in updateWorkspaceMember (del):', err);
      }

      return this.formatResponse({ member: updatedMember });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Member not found in this workspace');
      }
      throw error;
    }
  }

  @Delete(':slug/members/:memberId')
  @ApiOperation({
    summary: 'Remove a member from the workspace (Enterprise M2M)',
    description: 'Remove a workspace member by member ID, user ID, or user email address. Requires members:write scope.',
  })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'memberId', description: 'The workspace member ID, user ID, or user email address' })
  @ApiResponse({ status: 200, description: 'Member removed successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden: Missing scope or unauthorized.' })
  @ApiResponse({ status: 404, description: 'Member not found.' })
  async deleteWorkspaceMember(
    @V3Context() context: ApiV3Context,
    @Param('slug') slug: string,
    @Param('memberId') memberIdParam: string
  ) {
    if (!context.scopes.includes('members:write') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Missing members:write scope');
    }

    const workspaceId = context.workspaceId;
    if (!workspaceId) {
      throw new BadRequestException('Workspace context is missing');
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        ownerId: true,
        members: {
          where: {
            OR: [
              { id: memberIdParam },
              { userId: memberIdParam },
              { user: { email: memberIdParam } },
            ],
          },
          select: { id: true, userId: true },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (workspace.members.length === 0) {
      throw new NotFoundException('Member not found in this workspace');
    }

    const memberToDelete = workspace.members[0];

    if (workspace.ownerId === memberToDelete.userId) {
      throw new BadRequestException('Cannot remove workspace owner');
    }

    await prisma.workspaceMember.delete({
      where: { id: memberToDelete.id },
    });

    // Invalidate caches
    try {
      await this.redis.del(`v3:members:${workspaceId}`);
      await this.redis.del(`v2:members:${workspaceId}`);
    } catch (err) {
      this.logger.warn('Redis error in deleteWorkspaceMember (del):', err);
    }

    return this.formatResponse({ success: true });
  }

  private async resolveWorkspaceAndCheckAccess(context: ApiV3Context, slug: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true, organizationId: true, ownerId: true },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace with slug "${slug}" not found`);
    }

    if (context.organizationId) {
      if (workspace.organizationId !== context.organizationId) {
        const orgWithMember = await prisma.organization.findUnique({
          where: { id: context.organizationId },
          select: {
            members: {
              where: { userId: workspace.ownerId },
              select: { id: true },
            },
          },
        });
        const hasOwnerAccess = orgWithMember && orgWithMember.members.length > 0;
        if (!hasOwnerAccess) {
          throw new ForbiddenException('M2M application is not authorized to access this workspace');
        }
      }
    } else if (context.workspaceId) {
      if (workspace.id !== context.workspaceId) {
        throw new ForbiddenException('Token is not authorized for this workspace');
      }
    } else {
      const member = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: workspace.id,
            userId: context.userId!,
          },
        },
        select: { id: true, role: true },
      });
      if (!member) {
        throw new ForbiddenException('You are not a member of this workspace');
      }
    }

    return workspace;
  }

  @Get(':slug/channels')
  @ApiOperation({
    summary: 'List channels in a workspace (Enterprise M2M)',
    description: 'Retrieve all public channels and authorized private channels in a workspace. Requires channels:read scope.',
  })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiResponse({ status: 200, description: 'List of channels returned successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden: Missing channels:read scope or unauthorized workspace access.' })
  async getChannels(@V3Context() context: ApiV3Context, @Param('slug') slug: string) {
    if (!context.scopes.includes('channels:read') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Missing channels:read scope');
    }

    const workspace = await this.resolveWorkspaceAndCheckAccess(context, slug);

    const cacheKey = `v3:ws:${workspace.id}:channels`;
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return this.formatResponse({ channels: JSON.parse(cached) });
      }
    } catch (err) {
      this.logger.warn('Redis error in getChannels (get):', err);
    }

    const channels = await prisma.channel.findMany({
      where: { workspaceId: workspace.id },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        type: true,
        description: true,
        isPrivate: true,
        metadata: true,
        workspaceId: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    });

    try {
      await this.redis.setex(cacheKey, 600, JSON.stringify(channels));
    } catch (err) {
      this.logger.warn('Redis error in getChannels (setex):', err);
    }

    return this.formatResponse({ channels });
  }

  @Post(':slug/channels')
  @ApiOperation({
    summary: 'Create a channel in a workspace (Enterprise M2M)',
    description: 'Create a new channel with customizable visibility, icon, metadata, and members. Requires channels:write scope.',
  })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiBody({ type: V3CreateChannelDto })
  @ApiResponse({ status: 201, description: 'Channel created successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden: Missing channels:write scope or unauthorized access.' })
  async createChannel(
    @V3Context() context: ApiV3Context,
    @Param('slug') slug: string,
    @Body() body: V3CreateChannelDto
  ) {
    if (!context.scopes.includes('channels:write') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Missing channels:write scope');
    }

    const workspace = await this.resolveWorkspaceAndCheckAccess(context, slug);

    const validatedData = v3CreateChannelSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }
    const data = validatedData.data;

    const channelSlug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const isPrivate = data.isPrivate !== undefined ? data.isPrivate : data.type === 'private';
    const type = data.type || (isPrivate ? 'private' : 'public');

    const createdById = context.organizationId ? workspace.ownerId : (context.userId || workspace.ownerId);

    const initialMembersToCreate = (data.initialMembers || []).map(m => ({
      userId: m.userId,
      role: m.role || 'member',
      permissions: m.permissions ? BigInt(m.permissions) : null,
    }));

    if (createdById && !initialMembersToCreate.some(m => m.userId === createdById)) {
      initialMembersToCreate.push({ userId: createdById, role: 'admin', permissions: null });
    }

    const channel = await prisma.channel.create({
      data: {
        name: data.name,
        slug: channelSlug,
        description: data.description,
        type,
        isPrivate,
        icon: data.icon || '#',
        metadata: data.metadata ?? undefined,
        workspaceId: workspace.id,
        createdById,
        members: {
          create: initialMembersToCreate,
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
      },
    });

    try {
      await this.redis.del(`v3:ws:${workspace.id}:channels`);
    } catch (err) {
      this.logger.warn('Redis error in createChannel (del):', err);
    }

    prisma.workspaceAuditLog
      .create({
        data: {
          workspaceId: workspace.id,
          userId: context.userId,
          action: 'channel.created',
          resource: 'channel',
          resourceId: channel.id,
          metadata: { name: data.name, type, isPrivate } as any,
        },
      })
      .catch(err => this.logger.error('Audit log error in createChannel:', err));

    const formattedChannel = {
      ...channel,
      members: channel.members.map(m => ({
        ...m,
        permissions: m.permissions ? m.permissions.toString() : null,
      })),
    };

    return this.formatResponse({ channel: formattedChannel });
  }

  @Get(':slug/channels/:channelId')
  @ApiOperation({
    summary: 'Get channel details (Enterprise M2M)',
    description: 'Retrieve details of a specific channel in a workspace. Requires channels:read scope.',
  })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'channelId', description: 'The channel ID' })
  @ApiResponse({ status: 200, description: 'Channel details returned successfully.' })
  @ApiResponse({ status: 404, description: 'Channel not found.' })
  async getChannel(
    @V3Context() context: ApiV3Context,
    @Param('slug') slug: string,
    @Param('channelId') channelId: string
  ) {
    if (!context.scopes.includes('channels:read') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Missing channels:read scope');
    }

    const workspace = await this.resolveWorkspaceAndCheckAccess(context, slug);

    /**
     * ⚡ Performance Optimization:
     * Replaces `prisma.channel.findFirst` with extra database relation filters with a direct O(1) primary key
     * point lookup via `prisma.channel.findUnique({ where: { id: channelId } })`. Primary key point lookups allow
     * the PostgreSQL query planner to perform direct B-Tree index lookups without additional filter scans.
     * Workspace authorization (`channel.workspaceId !== workspace.id`) is validated in application memory.
     */
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
        _count: { select: { members: true, messages: true } },
      },
    });

    if (!channel || channel.workspaceId !== workspace.id) {
      throw new NotFoundException('Channel not found in this workspace');
    }

    const formattedChannel = {
      ...channel,
      members: channel.members.map(m => ({
        ...m,
        permissions: m.permissions ? m.permissions.toString() : null,
      })),
    };

    return this.formatResponse({ channel: formattedChannel });
  }

  @Patch(':slug/channels/:channelId')
  @ApiOperation({
    summary: 'Update channel configuration and visibility (Enterprise M2M)',
    description: 'Update settings, name, description, icon, metadata, or visibility of a channel. Requires channels:write scope.',
  })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'channelId', description: 'The channel ID' })
  @ApiBody({ type: V3UpdateChannelDto })
  @ApiResponse({ status: 200, description: 'Channel updated successfully.' })
  @ApiResponse({ status: 404, description: 'Channel not found.' })
  async updateChannel(
    @V3Context() context: ApiV3Context,
    @Param('slug') slug: string,
    @Param('channelId') channelId: string,
    @Body() body: V3UpdateChannelDto
  ) {
    if (!context.scopes.includes('channels:write') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Missing channels:write scope');
    }

    const workspace = await this.resolveWorkspaceAndCheckAccess(context, slug);

    const validatedData = v3UpdateChannelSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }
    const data = validatedData.data;

    const isPrivate = data.isPrivate !== undefined ? data.isPrivate : (data.type ? data.type === 'private' : undefined);
    const type = data.type !== undefined ? data.type : (isPrivate !== undefined ? (isPrivate ? 'private' : 'public') : undefined);

    try {
      const updatedChannel = await prisma.channel.update({
        where: { id: channelId, workspaceId: workspace.id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(type !== undefined && { type }),
          ...(isPrivate !== undefined && { isPrivate }),
          ...(data.icon && { icon: data.icon }),
          ...(data.metadata !== undefined && { metadata: data.metadata }),
        },
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, email: true, avatar: true } },
            },
          },
        },
      });

      try {
        await this.redis.del(`v3:ws:${workspace.id}:channels`);
      } catch (err) {
        this.logger.warn('Redis error in updateChannel (del):', err);
      }

      prisma.workspaceAuditLog
        .create({
          data: {
            workspaceId: workspace.id,
            userId: context.userId,
            action: 'channel.updated',
            resource: 'channel',
            resourceId: channelId,
            metadata: data as any,
          },
        })
        .catch(err => this.logger.error('Audit log error in updateChannel:', err));

      const formattedChannel = {
        ...updatedChannel,
        members: updatedChannel.members.map(m => ({
          ...m,
          permissions: m.permissions ? m.permissions.toString() : null,
        })),
      };

      return this.formatResponse({ channel: formattedChannel });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Channel not found in this workspace');
      }
      throw error;
    }
  }

  @Delete(':slug/channels/:channelId')
  @ApiOperation({
    summary: 'Delete a channel (Enterprise M2M)',
    description: 'Permanently deletes a channel from a workspace. Requires channels:write scope.',
  })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'channelId', description: 'The channel ID' })
  @ApiResponse({ status: 200, description: 'Channel deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Channel not found.' })
  async deleteChannel(
    @V3Context() context: ApiV3Context,
    @Param('slug') slug: string,
    @Param('channelId') channelId: string
  ) {
    if (!context.scopes.includes('channels:write') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Missing channels:write scope');
    }

    const workspace = await this.resolveWorkspaceAndCheckAccess(context, slug);

    try {
      await prisma.channel.delete({
        where: { id: channelId, workspaceId: workspace.id },
      });

      try {
        await this.redis.del(`v3:ws:${workspace.id}:channels`);
      } catch (err) {
        this.logger.warn('Redis error in deleteChannel (del):', err);
      }

      prisma.workspaceAuditLog
        .create({
          data: {
            workspaceId: workspace.id,
            userId: context.userId,
            action: 'channel.deleted',
            resource: 'channel',
            resourceId: channelId,
          },
        })
        .catch(err => this.logger.error('Audit log error in deleteChannel:', err));

      return this.formatResponse({ success: true });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Channel not found in this workspace');
      }
      throw error;
    }
  }

  @Get(':slug/channels/:channelId/members')
  @ApiOperation({
    summary: 'List channel members (Enterprise M2M)',
    description: 'Retrieve members belonging to a specific channel. Requires channels:read scope.',
  })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'channelId', description: 'The channel ID' })
  @ApiResponse({ status: 200, description: 'List of channel members returned successfully.' })
  async getChannelMembers(
    @V3Context() context: ApiV3Context,
    @Param('slug') slug: string,
    @Param('channelId') channelId: string
  ) {
    if (!context.scopes.includes('channels:read') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Missing channels:read scope');
    }

    const workspace = await this.resolveWorkspaceAndCheckAccess(context, slug);

    const members = await prisma.channelMember.findMany({
      where: { channelId, channel: { workspaceId: workspace.id } },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true, status: true } },
      },
    });

    const formattedMembers = members.map(m => ({
      ...m,
      permissions: m.permissions ? m.permissions.toString() : null,
    }));

    return this.formatResponse({ members: formattedMembers });
  }

  @Post(':slug/channels/:channelId/members')
  @ApiOperation({
    summary: 'Add members to a channel (Enterprise M2M)',
    description: 'Add user(s) to a channel using user IDs, member IDs, or email addresses with customizable role and permissions. Requires channels:write scope.',
  })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'channelId', description: 'The channel ID' })
  @ApiBody({ type: V3AddChannelMemberDto })
  @ApiResponse({ status: 201, description: 'Members added to channel successfully.' })
  async addChannelMembers(
    @V3Context() context: ApiV3Context,
    @Param('slug') slug: string,
    @Param('channelId') channelId: string,
    @Body() body: V3AddChannelMemberDto
  ) {
    if (!context.scopes.includes('channels:write') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Missing channels:write scope');
    }

    const workspace = await this.resolveWorkspaceAndCheckAccess(context, slug);

    const validatedData = v3AddChannelMemberSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }
    const data = validatedData.data;

    const inputIdentifiers = [
      ...(data.userIds || []),
      ...(data.memberIds || []),
      ...(data.emails || []),
      ...(data.userId ? [data.userId] : []),
      ...(data.memberId ? [data.memberId] : []),
      ...(data.email ? [data.email] : []),
    ];

    if (inputIdentifiers.length === 0) {
      throw new BadRequestException('userId, memberId, email, userIds, memberIds, or emails required');
    }

    const channel = await prisma.channel.findUnique({
      where: { id: channelId, workspaceId: workspace.id },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found in this workspace');
    }

    const matchedUsers = await prisma.user.findMany({
      where: {
        OR: [
          { id: { in: inputIdentifiers } },
          { email: { in: inputIdentifiers } },
          { workspaceMemberships: { some: { id: { in: inputIdentifiers }, workspaceId: workspace.id } } },
        ],
      },
      select: { id: true },
    });

    const userIdsToAdd = [...new Set(matchedUsers.map(u => u.id))];

    if (userIdsToAdd.length === 0) {
      throw new NotFoundException('No valid users found for the provided identifiers');
    }

    let permissionsBigInt: bigint | null = null;
    if (data.permissions !== undefined) {
      try {
        permissionsBigInt = BigInt(data.permissions);
      } catch (err) {
        throw new BadRequestException('Invalid bitwise permissions format');
      }
    }

    await prisma.channelMember.createMany({
      data: userIdsToAdd.map(uId => ({
        channelId,
        userId: uId,
        role: data.role || 'member',
        permissions: permissionsBigInt,
      })),
      skipDuplicates: true,
    });

    const members = await prisma.channelMember.findMany({
      where: { channelId },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });

    const formattedMembers = members.map(m => ({
      ...m,
      permissions: m.permissions ? m.permissions.toString() : null,
    }));

    return this.formatResponse({ members: formattedMembers });
  }

  @Patch(':slug/channels/:channelId/members/:memberId')
  @ApiOperation({
    summary: 'Update channel member role and permissions (Enterprise M2M)',
    description: 'Update the role or bitwise permissions of a channel member using user ID, member ID, or email address. Requires channels:write scope.',
  })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'channelId', description: 'The channel ID' })
  @ApiParam({ name: 'memberId', description: 'The user ID, workspace member ID, or user email address' })
  @ApiBody({ type: V3UpdateChannelMemberDto })
  @ApiResponse({ status: 200, description: 'Channel member updated successfully.' })
  @ApiResponse({ status: 404, description: 'Member not found in channel.' })
  async updateChannelMember(
    @V3Context() context: ApiV3Context,
    @Param('slug') slug: string,
    @Param('channelId') channelId: string,
    @Param('memberId') memberIdParam: string,
    @Body() body: V3UpdateChannelMemberDto
  ) {
    if (!context.scopes.includes('channels:write') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Missing channels:write scope');
    }

    const workspace = await this.resolveWorkspaceAndCheckAccess(context, slug);

    const validatedData = v3UpdateChannelMemberSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }
    const data = validatedData.data;

    let permissionsBigInt: bigint | undefined = undefined;
    if (data.permissions !== undefined) {
      try {
        permissionsBigInt = BigInt(data.permissions);
      } catch (err) {
        throw new BadRequestException('Invalid bitwise permissions format');
      }
    }

    const existingChannelMember = await prisma.channelMember.findFirst({
      where: {
        channelId,
        channel: { workspaceId: workspace.id },
        OR: [
          { userId: memberIdParam },
          { user: { email: memberIdParam } },
          { user: { workspaceMemberships: { some: { id: memberIdParam, workspaceId: workspace.id } } } },
        ],
      },
      select: { id: true },
    });

    if (!existingChannelMember) {
      throw new NotFoundException('Member not found in this channel');
    }

    try {
      const updatedMember = await prisma.channelMember.update({
        where: { id: existingChannelMember.id },
        data: {
          ...(data.role && { role: data.role }),
          ...(permissionsBigInt !== undefined && { permissions: permissionsBigInt }),
        },
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
        },
      });

      return this.formatResponse({
        member: {
          ...updatedMember,
          permissions: updatedMember.permissions ? updatedMember.permissions.toString() : null,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Member not found in this channel');
      }
      throw error;
    }
  }

  @Delete(':slug/channels/:channelId/members/:memberId')
  @ApiOperation({
    summary: 'Remove a member from a channel (Enterprise M2M)',
    description: 'Remove a specific member from a channel using user ID, workspace member ID, or email address. Requires channels:write scope.',
  })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'channelId', description: 'The channel ID' })
  @ApiParam({ name: 'memberId', description: 'The user ID, workspace member ID, or user email address' })
  @ApiResponse({ status: 200, description: 'Member removed from channel successfully.' })
  async deleteChannelMember(
    @V3Context() context: ApiV3Context,
    @Param('slug') slug: string,
    @Param('channelId') channelId: string,
    @Param('memberId') memberIdParam: string
  ) {
    if (!context.scopes.includes('channels:write') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Missing channels:write scope');
    }

    const workspace = await this.resolveWorkspaceAndCheckAccess(context, slug);

    /**
     * ⚡ Performance Optimization:
     * Replaces sequential read-then-delete queries (`findFirst` followed by `delete`) with a single atomic
     * `prisma.channelMember.deleteMany` operation using compound tenant filters.
     * This reduces database round-trips (RTT) from 2 queries down to 1 and eliminates read-then-delete race conditions.
     * Expected impact: ~50% reduction in database latency for channel member removals.
     */
    await prisma.channelMember.deleteMany({
      where: {
        channelId,
        channel: { workspaceId: workspace.id },
        OR: [
          { userId: memberIdParam },
          { user: { email: memberIdParam } },
          { user: { workspaceMemberships: { some: { id: memberIdParam, workspaceId: workspace.id } } } },
        ],
      },
    });

    return this.formatResponse({ success: true });
  }
}

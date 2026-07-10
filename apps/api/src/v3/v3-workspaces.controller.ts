import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiProperty } from '@nestjs/swagger';
import { ApiV3Guard, ApiV3Context } from '../auth/api-v3.guard';
import { V3Context } from '../auth/v3-context.decorator';
import { ProvisioningService } from '../v2/provisioning.service';
import { prisma } from '@repo/database';
import { z } from 'zod';
import { IsString, IsOptional, IsEmail, IsArray } from 'class-validator';

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

    return { workspaces };
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
  @ApiResponse({ status: 201, description: 'Workspace provisioned successfully.' })
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

    return this.provisioningService.provisionWorkspace(context, validatedData.data);
  }
}

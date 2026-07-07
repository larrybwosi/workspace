import { Controller, Post, Body, UseGuards, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiProperty } from '@nestjs/swagger';
import { ApiV2Guard, ApiV2Context } from '../auth/api-v2.guard';
import { V2Context } from '../auth/v2-context.decorator';
import { ProvisioningService } from './provisioning.service';
import { z } from 'zod';
import { IsString, IsOptional, IsEmail, IsArray } from 'class-validator';

class ProvisionWorkspaceDto {
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
  @ApiProperty({ example: 'Technology', required: false })
  industry?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'Primary workspace for Acme Corp teams', required: false })
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

@ApiTags('Provisioning')
@ApiBearerAuth()
@Controller('v2/provisioning')
@UseGuards(ApiV2Guard)
export class ProvisioningController {
  constructor(private readonly provisioningService: ProvisioningService) {}

  @Post('workspaces')
  @ApiOperation({
    summary: 'Provision a new workspace (Enterprise M2M)',
    description: `
Provisions a new workspace within your organization.
When provisioned via M2M:
1. A **System Bot** (Default Bot) is automatically created with admin privileges for the workspace.
2. Your M2M application is installed as an **Administrator** in the new workspace.
3. The specified owner and initial members are added (must belong to the same organization).

The System Bot acts as the default sender for messages and announcements sent via M2M if no application-specific bot is configured.
    `,
  })
  @ApiBody({ type: ProvisionWorkspaceDto })
  @ApiResponse({ status: 201, description: 'Workspace provisioned successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input or owner not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden: Missing provisioning:workspaces scope.' })
  async provisionWorkspace(@V2Context() context: ApiV2Context, @Body() body: ProvisionWorkspaceDto) {
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

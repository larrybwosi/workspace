import { Controller, Post, Body, UseGuards, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { ApiV2Guard, ApiV2Context } from '../auth/api-v2.guard';
import { V2Context } from '../auth/v2-context.decorator';
import { ProvisioningService } from './provisioning.service';
import { z } from 'zod';

class ProvisionWorkspaceDto {
  name: string;
  slug: string;
  ownerEmail: string;
  industry?: string;
  description?: string;
  icon?: string;
  brandingConfig?: any;
  channels?: string[];
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
  @ApiOperation({ summary: 'Provision a new workspace (Enterprise M2M)' })
  @ApiBody({ type: ProvisionWorkspaceDto })
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

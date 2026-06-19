import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiProperty } from '@nestjs/swagger';
import { ApiV2Guard, ApiV2Context } from '../../auth/api-v2.guard';
import { V2Context } from '../../auth/v2-context.decorator';
import { prisma } from '@repo/database';
import { z } from 'zod';
import { V2AuditService } from '../v2-audit.service';
import { V2WebhooksService } from '../v2-webhooks.service';

class CreateMappingDto {
  @ApiProperty({ example: 'user_123' })
  userId: string;

  @ApiProperty({ example: 'ext_user_abc' })
  externalUserId: string;

  @ApiProperty({ required: false })
  metadata?: Record<string, any>;
}

class BulkCreateMappingDto {
  @ApiProperty({ type: [CreateMappingDto] })
  mappings: CreateMappingDto[];
}

const createMappingSchema = z.object({
  userId: z.string().min(1),
  externalUserId: z.string().min(1),
  metadata: z.record(z.string(), z.any()).optional(),
});

const bulkCreateMappingSchema = z.object({
  mappings: z.array(createMappingSchema).min(1).max(100),
});

@ApiTags('M2M User Mappings')
@ApiBearerAuth()
@Controller('organizations/:orgSlug/m2m/mappings')
@UseGuards(ApiV2Guard)
export class M2mUserMappingController {
  constructor(
    private readonly auditService: V2AuditService,
    private readonly webhooksService: V2WebhooksService
  ) {}

  @Get()
  @ApiOperation({ summary: 'List user mappings for an organization' })
  @ApiParam({ name: 'orgSlug', description: 'The organization slug' })
  async getMappings(@V2Context() context: ApiV2Context, @Param('orgSlug') orgSlug: string) {
    const organization = await this.verifyOrgAccess(context, orgSlug);

    const mappings = await prisma.m2mUserMapping.findMany({
      where: { organizationId: organization.id },
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

    return { mappings };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user mapping' })
  @ApiParam({ name: 'orgSlug', description: 'The organization slug' })
  @ApiBody({ type: CreateMappingDto })
  async createMapping(
    @V2Context() context: ApiV2Context,
    @Param('orgSlug') orgSlug: string,
    @Body() body: CreateMappingDto
  ) {
    const organization = await this.verifyOrgAccess(context, orgSlug);

    const validatedData = createMappingSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }

    const mapping = await this.performMapping(organization.id, validatedData.data);

    await this.auditService.log(context, 'm2m.mapping.create', 'm2m_user_mapping', mapping.id, {
      userId: validatedData.data.userId,
      externalUserId: validatedData.data.externalUserId,
    });

    // Notify via M2M webhooks
    await this.notifyMappingChange(organization.id, 'm2m.mapping.created', mapping);

    return { mapping };
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk create user mappings' })
  @ApiParam({ name: 'orgSlug', description: 'The organization slug' })
  @ApiBody({ type: BulkCreateMappingDto })
  async bulkCreateMappings(
    @V2Context() context: ApiV2Context,
    @Param('orgSlug') orgSlug: string,
    @Body() body: BulkCreateMappingDto
  ) {
    const organization = await this.verifyOrgAccess(context, orgSlug);

    const validatedData = bulkCreateMappingSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }

    const { mappings } = validatedData.data;
    const results = [];

    for (const item of mappings) {
      const mapping = await this.performMapping(organization.id, item);
      results.push(mapping);

      // Notify via M2M webhooks for each
      await this.notifyMappingChange(organization.id, 'm2m.mapping.created', mapping);
    }

    await this.auditService.log(context, 'm2m.mapping.bulk_create', 'm2m_user_mapping', undefined, {
      count: results.length,
    });

    return { count: results.length, mappings: results };
  }

  @Delete(':externalUserId')
  @ApiOperation({ summary: 'Delete a user mapping' })
  @ApiParam({ name: 'orgSlug', description: 'The organization slug' })
  @ApiParam({ name: 'externalUserId', description: 'The external user ID' })
  async deleteMapping(
    @V2Context() context: ApiV2Context,
    @Param('orgSlug') orgSlug: string,
    @Param('externalUserId') externalUserId: string
  ) {
    const organization = await this.verifyOrgAccess(context, orgSlug);

    await prisma.m2mUserMapping.delete({
      where: {
        organizationId_externalUserId: {
          organizationId: organization.id,
          externalUserId,
        },
      },
    });

    await this.auditService.log(context, 'm2m.mapping.delete', 'm2m_user_mapping', undefined, {
      externalUserId,
    });

    return { success: true };
  }

  // fallow-ignore-next-line complexity
  private async performMapping(organizationId: string, data: { userId: string; externalUserId: string; metadata?: any }) {
    const { userId, externalUserId, metadata } = data;

    // SECURITY: Verify user exists AND is a member of the organization
    const member = await prisma.member.findFirst({
      where: {
        organizationId,
        userId,
      },
    });

    if (!member) {
      throw new BadRequestException(`User ${userId} is not a member of this organization`);
    }

    return prisma.m2mUserMapping.upsert({
      where: {
        organizationId_externalUserId: {
          organizationId,
          externalUserId,
        },
      },
      update: {
        userId,
        metadata: (metadata as any) || {},
      },
      create: {
        organizationId,
        userId,
        externalUserId,
        metadata: (metadata as any) || {},
      },
    });
  }

  private async notifyMappingChange(organizationId: string, eventType: string, mapping: any) {
    const m2mApps = await prisma.m2mApplication.findMany({
      where: { organizationId },
    });

    for (const app of m2mApps) {
      await this.webhooksService.dispatchM2mCallback(
        app,
        eventType,
        { mapping },
        '' // No specific workspace
      );
    }
  }

  // fallow-ignore-next-line complexity
  private async verifyOrgAccess(context: ApiV2Context, orgSlug: string) {
    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // If M2M token, verify it belongs to the same organization
    if (context.organizationId && context.organizationId !== organization.id) {
      throw new ForbiddenException('M2M application does not belong to this organization');
    }

    // If User token, verify they are admin/owner (should probably use a better check here but keeping it consistent with M2mController)
    if (!context.organizationId) {
      const member = await prisma.member.findFirst({
        where: {
          organizationId: organization.id,
          userId: context.userId,
        },
      });

      if (!member || !['admin', 'owner'].includes(member.role)) {
        throw new ForbiddenException('Only organization admins can manage user mappings');
      }
    }

    return organization;
  }
}

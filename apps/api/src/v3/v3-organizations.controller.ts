import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Patch,
  Body,
  UseGuards,
  UseFilters,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiProperty } from '@nestjs/swagger';
import { ApiV3Guard, ApiV3Context } from '../auth/api-v3.guard';
import { V3Context } from '../auth/v3-context.decorator';
import { V3ExceptionFilter } from './v3-exception.filter';
import { prisma } from '@repo/database';
import * as crypto from 'crypto';
import { z } from 'zod';
import { IsString, IsOptional, IsArray } from 'class-validator';

export class V3CreateM2mApplicationDto {
  @IsString()
  @ApiProperty({ example: 'CI/CD Pipeline' })
  name!: string;

  @IsArray()
  @IsOptional()
  @ApiProperty({ required: false, example: ['provisioning:workspaces'] })
  scopes?: string[];

  @IsArray()
  @IsOptional()
  @ApiProperty({ required: false, example: ['192.168.1.1'] })
  allowedIps?: string[];
}

export class V3UpdateM2mApplicationDto {
  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, example: 'CI/CD Pipeline Updated' })
  name?: string;

  @IsArray()
  @IsOptional()
  @ApiProperty({ required: false, example: ['provisioning:workspaces', 'messages:send'] })
  scopes?: string[];

  @IsArray()
  @IsOptional()
  @ApiProperty({ required: false, example: ['192.168.1.1'] })
  allowedIps?: string[];
}

export class V3UpdateOrganizationDto {
  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, example: 'Updated Organization Name' })
  name?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, example: 'https://example.com/logo.png' })
  logo?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, example: 'https://example.com/banner.png' })
  banner?: string;
}

const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  logo: z.string().optional(),
  banner: z.string().optional(),
});

@ApiTags('V3 Organizations')
@ApiBearerAuth()
@Controller('v3/organizations/:orgSlug')
@UseGuards(ApiV3Guard)
@UseFilters(V3ExceptionFilter)
export class V3OrganizationsController {
  private formatResponse<T>(data: T) {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('workspaces')
  @ApiOperation({ summary: 'List workspaces for an organization' })
  @ApiParam({ name: 'orgSlug', description: 'The organization slug' })
  async getOrganizationWorkspaces(@V3Context() context: ApiV3Context, @Param('orgSlug') orgSlug: string) {
    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: {
        id: true,
        members: context.organizationId
          ? undefined
          : {
              where: { userId: context.userId },
              select: { id: true },
            },
        workspaces: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
            description: true,
            ownerId: true,
            plan: true,
            settings: true,
            createdAt: true,
            updatedAt: true,
            isPublic: true,
            customDomain: true,
            brandingConfig: true,
            industry: true,
            organizationId: true,
            _count: {
              select: {
                members: true,
                channels: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    if (context.organizationId) {
      if (organization.id !== context.organizationId) {
        throw new ForbiddenException('Not authorized for this organization');
      }
    } else {
      if (!organization.members || organization.members.length === 0) {
        throw new ForbiddenException('Not a member of this organization');
      }
    }

    return this.formatResponse({ workspaces: organization.workspaces });
  }

  @Get()
  @ApiOperation({ summary: 'Get organization details' })
  @ApiParam({ name: 'orgSlug', description: 'The organization slug' })
  async getOrganization(@V3Context() context: ApiV3Context, @Param('orgSlug') orgSlug: string) {
    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        metadata: true,
        createdAt: true,
        members: context.organizationId
          ? undefined
          : {
              where: { userId: context.userId },
              select: { id: true },
            },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    if (context.organizationId) {
      if (organization.id !== context.organizationId) {
        throw new ForbiddenException('Not authorized for this organization');
      }
    } else {
      if (!organization.members || organization.members.length === 0) {
        throw new ForbiddenException('Not a member of this organization');
      }
    }

    const { members, ...orgData } = organization as any;
    return this.formatResponse({ organization: orgData });
  }

  @Patch()
  @ApiOperation({ summary: 'Update organization details' })
  @ApiParam({ name: 'orgSlug', description: 'The organization slug' })
  @ApiBody({ type: V3UpdateOrganizationDto })
  async updateOrganization(
    @V3Context() context: ApiV3Context,
    @Param('orgSlug') orgSlug: string,
    @Body() body: V3UpdateOrganizationDto
  ) {
    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: {
        id: true,
        members: context.organizationId
          ? undefined
          : {
              where: { userId: context.userId },
              select: { role: true },
            },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    if (context.organizationId) {
      if (organization.id !== context.organizationId) {
        throw new ForbiddenException('Not authorized for this organization');
      }
    } else {
      const member = organization.members?.[0];
      if (!member || !['owner', 'admin'].includes(member.role)) {
        throw new ForbiddenException('You do not have permission to update this organization');
      }
    }

    const validatedData = updateOrganizationSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }

    const updatedOrganization = await prisma.organization.update({
      where: { id: organization.id },
      data: validatedData.data,
    });

    return this.formatResponse({ organization: updatedOrganization });
  }

  @Get('m2m')
  @ApiOperation({ summary: 'List organization M2M applications' })
  @ApiParam({ name: 'orgSlug', description: 'The organization slug' })
  async getM2mApplications(@V3Context() context: ApiV3Context, @Param('orgSlug') orgSlug: string) {
    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: {
        id: true,
        name: true,
        clientId: true,
        scopes: true,
        allowedIps: true,
        createdAt: true,
        members: context.organizationId
          ? undefined
          : {
              where: { userId: context.userId },
              select: { role: true },
            },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    if (context.organizationId) {
      if (organization.id !== context.organizationId) {
        throw new ForbiddenException('Not authorized for this organization');
      }
    } else {
      if (!organization.members || organization.members.length === 0) {
        throw new ForbiddenException('Not a member of this organization');
      }
    }

    const applications = organization.clientId
      ? [
          {
            id: organization.id,
            name: organization.name,
            clientId: organization.clientId,
            scopes: organization.scopes || ['provisioning:workspaces'],
            allowedIps: organization.allowedIps || [],
            createdAt: organization.createdAt,
          },
        ]
      : [];

    return this.formatResponse({ applications });
  }

  @Post('m2m')
  @ApiOperation({ summary: 'Create organization M2M application credentials' })
  @ApiParam({ name: 'orgSlug', description: 'The organization slug' })
  @ApiBody({ type: V3CreateM2mApplicationDto })
  async createM2mApplication(
    @V3Context() context: ApiV3Context,
    @Param('orgSlug') orgSlug: string,
    @Body() body: V3CreateM2mApplicationDto
  ) {
    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: {
        id: true,
        name: true,
        members: context.organizationId
          ? undefined
          : {
              where: { userId: context.userId },
              select: { role: true },
            },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    if (context.organizationId) {
      if (organization.id !== context.organizationId) {
        throw new ForbiddenException('Not authorized for this organization');
      }
    } else {
      const member = organization.members?.[0];
      if (!member || !['owner', 'admin'].includes(member.role)) {
        throw new ForbiddenException('You do not have permission to manage M2M credentials');
      }
    }

    const clientId = `m2m_${crypto.randomBytes(12).toString('hex')}`;
    const clientSecret = `sk_m2m_${crypto.randomBytes(24).toString('hex')}`;
    const scopes = body.scopes || ['provisioning:workspaces'];
    const allowedIps = body.allowedIps || [];

    const updatedOrg = await prisma.organization.update({
      where: { id: organization.id },
      data: {
        clientId,
        clientSecret,
        scopes,
        allowedIps,
      },
      select: {
        id: true,
        clientId: true,
        scopes: true,
        allowedIps: true,
        createdAt: true,
      },
    });

    if (updatedOrg.clientId) {
      await prisma.oAuthClient.upsert({
        where: { clientId: updatedOrg.clientId },
        update: {
          name: body.name || organization.name,
          clientSecret,
        },
        create: {
          clientId: updatedOrg.clientId,
          clientSecret,
          name: body.name || organization.name,
          redirectUris: [],
        },
      });
    }

    return this.formatResponse({
      id: updatedOrg.id,
      name: body.name || organization.name,
      clientId: updatedOrg.clientId,
      clientSecret,
      scopes: updatedOrg.scopes,
      allowedIps: updatedOrg.allowedIps,
      createdAt: updatedOrg.createdAt,
    });
  }

  @Patch('m2m/:id')
  @ApiOperation({ summary: 'Update organization M2M application credentials and scopes' })
  @ApiParam({ name: 'orgSlug', description: 'The organization slug' })
  @ApiParam({ name: 'id', description: 'The M2M application/organization ID' })
  @ApiBody({ type: V3UpdateM2mApplicationDto })
  async updateM2mApplication(
    @V3Context() context: ApiV3Context,
    @Param('orgSlug') orgSlug: string,
    @Param('id') id: string,
    @Body() body: V3UpdateM2mApplicationDto
  ) {
    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: {
        id: true,
        name: true,
        clientId: true,
        scopes: true,
        allowedIps: true,
        createdAt: true,
        members: context.organizationId
          ? undefined
          : {
              where: { userId: context.userId },
              select: { role: true },
            },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    if (context.organizationId) {
      if (organization.id !== context.organizationId) {
        throw new ForbiddenException('Not authorized for this organization');
      }
    } else {
      const member = organization.members?.[0];
      if (!member || !['owner', 'admin'].includes(member.role)) {
        throw new ForbiddenException('You do not have permission to manage M2M credentials');
      }
    }

    if (organization.id !== id && organization.clientId !== id) {
      throw new NotFoundException('M2M application not found');
    }

    const updateData: any = {};
    if (body.name !== undefined) {
      updateData.name = body.name;
    }
    if (body.scopes !== undefined) {
      updateData.scopes = body.scopes;
    }
    if (body.allowedIps !== undefined) {
      updateData.allowedIps = body.allowedIps;
    }

    const updatedOrg = await prisma.organization.update({
      where: { id: organization.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        clientId: true,
        scopes: true,
        allowedIps: true,
        createdAt: true,
      },
    });

    if (updatedOrg.clientId) {
      await prisma.oAuthClient.upsert({
        where: { clientId: updatedOrg.clientId },
        update: {
          name: updatedOrg.name,
        },
        create: {
          clientId: updatedOrg.clientId,
          name: updatedOrg.name,
          redirectUris: [],
        },
      });
    }

    return this.formatResponse({
      id: updatedOrg.id,
      name: updatedOrg.name,
      clientId: updatedOrg.clientId,
      scopes: updatedOrg.scopes,
      allowedIps: updatedOrg.allowedIps,
      createdAt: updatedOrg.createdAt,
    });
  }

  @Delete('m2m/:id')
  @ApiOperation({ summary: 'Delete organization M2M application credentials' })
  @ApiParam({ name: 'orgSlug', description: 'The organization slug' })
  @ApiParam({ name: 'id', description: 'The M2M application/organization ID' })
  async deleteM2mApplication(
    @V3Context() context: ApiV3Context,
    @Param('orgSlug') orgSlug: string,
    @Param('id') id: string
  ) {
    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: {
        id: true,
        members: context.organizationId
          ? undefined
          : {
              where: { userId: context.userId },
              select: { role: true },
            },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    if (context.organizationId) {
      if (organization.id !== context.organizationId) {
        throw new ForbiddenException('Not authorized for this organization');
      }
    } else {
      const member = organization.members?.[0];
      if (!member || !['owner', 'admin'].includes(member.role)) {
        throw new ForbiddenException('You do not have permission to manage M2M credentials');
      }
    }

    const currentOrg = await prisma.organization.findUnique({
      where: { id: organization.id },
      select: { clientId: true },
    });

    if (currentOrg?.clientId) {
      await prisma.oAuthClient.deleteMany({
        where: { clientId: currentOrg.clientId },
      });
    }

    await prisma.organization.update({
      where: { id: organization.id },
      data: {
        clientId: null,
        clientSecret: null,
        scopes: [],
        allowedIps: [],
      },
    });

    return this.formatResponse({ success: true });
  }
}

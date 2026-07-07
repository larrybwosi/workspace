import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  UseGuards,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiProperty } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { prisma } from '@repo/database';
import type { User } from '@repo/database';
import { z } from 'zod';
import { IsString, IsOptional } from 'class-validator';

class UpdateOrganizationDto {
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

@ApiTags('Organizations')
@ApiBearerAuth()
@Controller('organizations/:orgSlug')
@UseGuards(AuthGuard)
export class OrganizationsController {
  @Get('workspaces')
  @ApiOperation({ summary: 'List workspaces for an organization' })
  @ApiParam({ name: 'orgSlug', description: 'The organization slug' })
  async getOrganizationWorkspaces(@CurrentUser() user: User, @Param('orgSlug') orgSlug: string) {
    /**
     * ⚡ Performance Optimization:
     * 1. Consolidates organization lookup, membership verification, and workspace retrieval into a single query.
     * 2. Uses nested 'select' to fetch only required fields, reducing database payload and memory usage.
     * Expected impact: Reduces database round-trips from 2 down to 1.
     */
    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: {
        id: true,
        members: {
          where: { userId: user.id },
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

    if (organization.members.length === 0) {
      throw new ForbiddenException('Not a member of this organization');
    }

    return { workspaces: organization.workspaces };
  }

  @Get()
  @ApiOperation({ summary: 'Get organization details' })
  @ApiParam({ name: 'orgSlug', description: 'The organization slug' })
  async getOrganization(@CurrentUser() user: User, @Param('orgSlug') orgSlug: string) {
    /**
     * ⚡ Performance Optimization:
     * 1. Consolidates organization retrieval and membership verification into a single query.
     * 2. Uses 'select' to retrieve only essential organization fields.
     * Expected impact: Reduces database round-trips from 2 down to 1.
     */
    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        metadata: true,
        createdAt: true,
        members: {
          where: { userId: user.id },
          select: { id: true },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    if (organization.members.length === 0) {
      throw new ForbiddenException('Not a member of this organization');
    }

    return { organization };
  }

  @Patch()
  @ApiOperation({ summary: 'Update organization details' })
  @ApiParam({ name: 'orgSlug', description: 'The organization slug' })
  @ApiBody({ type: UpdateOrganizationDto })
  async updateOrganization(
    @CurrentUser() user: User,
    @Param('orgSlug') orgSlug: string,
    @Body() body: UpdateOrganizationDto
  ) {
    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: {
        id: true,
        members: {
          where: { userId: user.id },
          select: { role: true },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const member = organization.members[0];
    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new ForbiddenException('You do not have permission to update this organization');
    }

    const validatedData = updateOrganizationSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }

    const updatedOrganization = await prisma.organization.update({
      where: { id: organization.id },
      data: validatedData.data,
    });

    return { organization: updatedOrganization };
  }
}

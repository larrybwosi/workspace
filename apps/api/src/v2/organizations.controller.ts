import {
  Controller,
  Get,
  Param,
  UseGuards,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { prisma } from '@repo/database';
import type { User } from '@repo/database';

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

}

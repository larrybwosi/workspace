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
    const organization = await this.verifyOrgMember(user.id, orgSlug);

    const workspaces = await prisma.workspace.findMany({
      where: { organizationId: organization.id },
      include: {
        _count: {
          select: {
            members: true,
            channels: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { workspaces };
  }

  @Get()
  @ApiOperation({ summary: 'Get organization details' })
  @ApiParam({ name: 'orgSlug', description: 'The organization slug' })
  async getOrganization(@CurrentUser() user: User, @Param('orgSlug') orgSlug: string) {
    const organization = await this.verifyOrgMember(user.id, orgSlug);
    return { organization };
  }

  private async verifyOrgMember(userId: string, orgSlug: string) {
    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const member = organization.members[0];
    if (!member) {
      throw new ForbiddenException('Not a member of this organization');
    }

    return organization;
  }
}

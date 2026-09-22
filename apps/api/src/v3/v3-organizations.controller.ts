import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
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
import { z } from 'zod';
import { IsString, IsArray, IsOptional } from 'class-validator';
import * as crypto from 'crypto';
import { sendOrganizationInviteEmail } from '@repo/shared';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

class V3CreateM2mApplicationDto {
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

class V3UpdateM2mApplicationDto {
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

class V3UpdateOrganizationDto {
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

class V3InviteMemberDto {
  @IsString()
  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, example: 'member' })
  role?: string;
}

const updateOrganizationSchema = z.object({
  name: z.string().min(1).optional(),
  logo: z.string().url().nullable().optional(),
  banner: z.string().url().nullable().optional(),
});

@ApiTags('V3 Organizations')
@ApiBearerAuth()
@Controller('v3/organizations')
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

  // --- Public endpoints for Invitation lookup and accepting ---
  @Get('invitations/by-token/:token')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Get organization invitation details by token' })
  async getInvitationByToken(@Param('token') token: string) {
    const invitation = await prisma.organizationInvitation.findUnique({
      where: { id: token },
      include: {
        organization: {
          select: { id: true, name: true, slug: true, logo: true },
        },
        inviter: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invitation has expired');
    }

    return this.formatResponse({ invitation });
  }

  @Post('invitations/by-token/:token/accept')
  @ApiOperation({ summary: 'Accept an organization invitation' })
  async acceptInvitation(@V3Context() context: ApiV3Context, @Param('token') token: string) {
    if (!context.userId) {
      throw new ForbiddenException('User authentication required');
    }

    const invitation = await prisma.organizationInvitation.findUnique({
      where: { id: token },
      include: {
        organization: true,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invitation has expired');
    }

    // Check if user is already a member
    const existingMember = await prisma.member.findFirst({
      where: {
        organizationId: invitation.organizationId,
        userId: context.userId,
      },
    });

    if (!existingMember) {
      await prisma.member.create({
        data: {
          organizationId: invitation.organizationId,
          userId: context.userId,
          role: invitation.role || 'member',
        },
      });
    }

    // Delete or mark invitation
    await prisma.organizationInvitation.delete({
      where: { id: invitation.id },
    }).catch(() => null);

    return this.formatResponse({
      success: true,
      organization: invitation.organization,
    });
  }

  // --- Scoped Organization Routes ---
  @Get(':orgSlug/members')
  @ApiOperation({ summary: 'List organization members' })
  @ApiParam({ name: 'orgSlug', description: 'The organization slug' })
  async getOrganizationMembers(@V3Context() context: ApiV3Context, @Param('orgSlug') orgSlug: string) {
    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const members = await prisma.member.findMany({
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
      orderBy: { createdAt: 'asc' },
    });

    return this.formatResponse({ members });
  }

  @Get(':orgSlug/invitations')
  @ApiOperation({ summary: 'List pending organization invitations' })
  @ApiParam({ name: 'orgSlug', description: 'The organization slug' })
  async getOrganizationInvitations(@V3Context() context: ApiV3Context, @Param('orgSlug') orgSlug: string) {
    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const invitations = await prisma.organizationInvitation.findMany({
      where: {
        organizationId: organization.id,
        expiresAt: { gt: new Date() },
      },
      include: {
        inviter: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return this.formatResponse({ invitations });
  }

  @Post(':orgSlug/invitations')
  @ApiOperation({ summary: 'Invite a member to the organization' })
  @ApiParam({ name: 'orgSlug', description: 'The organization slug' })
  @ApiBody({ type: V3InviteMemberDto })
  async inviteMember(
    @V3Context() context: ApiV3Context,
    @Param('orgSlug') orgSlug: string,
    @Body() body: V3InviteMemberDto
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

    if (!context.organizationId) {
      const member = organization.members?.[0];
      if (!member || !['owner', 'admin'].includes(member.role)) {
        throw new ForbiddenException('You do not have permission to invite members');
      }
    }

    const email = body.email.trim().toLowerCase();
    const role = body.role || 'member';

    // Check if user is already a member
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const existingMember = await prisma.member.findFirst({
        where: {
          organizationId: organization.id,
          userId: existingUser.id,
        },
      });

      if (existingMember) {
        throw new BadRequestException('User is already a member of this organization');
      }
    }

    // Expiration: 7 days
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const inviterId = context.userId || (await prisma.member.findFirst({
      where: { organizationId: organization.id, role: 'owner' },
    }))?.userId || '';

    const invitation = await prisma.organizationInvitation.create({
      data: {
        organizationId: organization.id,
        email,
        role,
        status: 'pending',
        expiresAt,
        inviterId,
      },
      include: {
        inviter: {
          select: { name: true, email: true },
        },
      },
    });

    // Build invitation URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3000';
    const inviteUrl = `${appUrl.replace(/\/$/, '')}/organization/invite/${invitation.id}`;

    // Send email asynchronously
    sendOrganizationInviteEmail({
      to: email,
      url: inviteUrl,
      organizationName: organization.name,
      inviterName: invitation.inviter?.name || invitation.inviter?.email || 'An admin',
      role,
    }).catch(err => {
      console.error('Failed to send organization invitation email:', err);
    });

    return this.formatResponse({ invitation });
  }

  @Delete(':orgSlug/invitations/:invitationId')
  @ApiOperation({ summary: 'Revoke an organization invitation' })
  @ApiParam({ name: 'orgSlug', description: 'The organization slug' })
  @ApiParam({ name: 'invitationId', description: 'The invitation ID' })
  async revokeInvitation(
    @V3Context() context: ApiV3Context,
    @Param('orgSlug') orgSlug: string,
    @Param('invitationId') invitationId: string
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

    if (!context.organizationId) {
      const member = organization.members?.[0];
      if (!member || !['owner', 'admin'].includes(member.role)) {
        throw new ForbiddenException('You do not have permission to revoke invitations');
      }
    }

    await prisma.organizationInvitation.deleteMany({
      where: {
        id: invitationId,
        organizationId: organization.id,
      },
    });

    return this.formatResponse({ success: true });
  }

  @Get(':orgSlug/workspaces')
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

    const workspaces = await prisma.workspace.findMany({
      where: { organizationId: organization.id },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        description: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return this.formatResponse({ workspaces });
  }

  @Get(':orgSlug')
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
        banner: true,
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

    return this.formatResponse({ organization });
  }

  @Patch(':orgSlug')
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

  @Get(':orgSlug/m2m')
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

  @Post(':orgSlug/m2m')
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

  @Patch(':orgSlug/m2m/:id')
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

  @Delete(':orgSlug/m2m/:id')
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

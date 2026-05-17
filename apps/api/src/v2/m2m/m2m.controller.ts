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
import { AuthGuard } from '../../auth/auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { prisma } from '@repo/database';
import type { User } from '@repo/database';
import { z } from 'zod';
import * as crypto from 'crypto';

class CreateM2mApplicationDto {
  @ApiProperty({ example: 'Provisioning App' })
  name: string;

  @ApiProperty({ example: ['provisioning:workspaces'], required: false })
  scopes?: string[];

  @ApiProperty({ example: ['127.0.0.1'], required: false })
  allowedIps?: string[];
}

const createM2mSchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(z.string()).optional().default(['provisioning:workspaces']),
  allowedIps: z.array(z.string()).optional().default([]),
});

@ApiTags('M2M Applications')
@ApiBearerAuth()
@Controller('organizations/:orgSlug/m2m')
@UseGuards(AuthGuard)
export class M2mController {
  @Get()
  @ApiOperation({ summary: 'List M2M applications for an organization' })
  @ApiParam({ name: 'orgSlug', description: 'The organization slug' })
  async getM2mApplications(@CurrentUser() user: User, @Param('orgSlug') orgSlug: string) {
    const organization = await this.verifyOrgAdmin(user.id, orgSlug);

    const applications = await prisma.m2mApplication.findMany({
      where: { organizationId: organization.id },
      select: {
        id: true,
        name: true,
        clientId: true,
        scopes: true,
        allowedIps: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { applications };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new M2M application' })
  @ApiParam({ name: 'orgSlug', description: 'The organization slug' })
  @ApiBody({ type: CreateM2mApplicationDto })
  async createM2mApplication(
    @CurrentUser() user: User,
    @Param('orgSlug') orgSlug: string,
    @Body() body: CreateM2mApplicationDto
  ) {
    const organization = await this.verifyOrgAdmin(user.id, orgSlug);

    const validatedData = createM2mSchema.safeParse(body);
    if (!validatedData.success) {
      throw new BadRequestException(validatedData.error.issues);
    }
    const { name, scopes, allowedIps } = validatedData.data;

    const clientId = `m2m_${crypto.randomBytes(16).toString('hex')}`;
    const clientSecret = crypto.randomBytes(32).toString('hex');
    const hashedSecret = crypto.createHash('sha256').update(clientSecret).digest('hex');

    const application = await prisma.m2mApplication.create({
      data: {
        name,
        clientId,
        clientSecret: hashedSecret,
        organizationId: organization.id,
        scopes,
        allowedIps,
      },
    });

    return {
      ...application,
      clientSecret, // Return raw once
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an M2M application' })
  @ApiParam({ name: 'orgSlug', description: 'The organization slug' })
  @ApiParam({ name: 'id', description: 'The application ID' })
  async deleteM2mApplication(@CurrentUser() user: User, @Param('orgSlug') orgSlug: string, @Param('id') id: string) {
    const organization = await this.verifyOrgAdmin(user.id, orgSlug);

    await prisma.m2mApplication.delete({
      where: { id, organizationId: organization.id },
    });

    return { success: true };
  }

  private async verifyOrgAdmin(userId: string, orgSlug: string) {
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
    if (!member || !['admin', 'owner'].includes(member.role)) {
      throw new ForbiddenException('Only organization admins can manage M2M applications');
    }

    return organization;
  }
}

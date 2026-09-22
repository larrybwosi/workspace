import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
  UseFilters,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiProperty, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { V3ExceptionFilter } from './v3-exception.filter';
import { ApiV3Guard, ApiV3Context } from '../auth/api-v3.guard';
import { V3Context } from '../auth/v3-context.decorator';
import { prisma } from '@repo/database';
import { sendSetPasswordEmail, validateEnv } from '@repo/shared';
import { auth } from '@repo/auth';
import { IsString, IsOptional, IsEmail } from 'class-validator';

export class V3CreateUserDto {
  @IsEmail()
  @ApiProperty({ example: 'user@acme.com', description: 'The unique email address of the user to create or provision' })
  email: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'Jane Doe', required: false, description: 'The full name of the user' })
  name?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'https://example.com/avatar.png', required: false, description: 'Profile avatar image URL' })
  avatar?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'org_12345', required: false, description: 'Optional organization ID to automatically associate user with' })
  organizationId?: string;
}

@ApiTags('V3 Users')
@ApiBearerAuth()
@UseGuards(ApiV3Guard)
@UseFilters(V3ExceptionFilter)
@AllowAnonymous()
@Controller('v3/users')
export class V3UsersController {
  private readonly logger = new Logger(V3UsersController.name);

  private formatResponse(data: any) {
    return {
      success: true,
      data,
    };
  }

  @Post()
  @ApiOperation({
    summary: 'Create or provision a user account (Enterprise M2M)',
    description:
      'Creates a new user record or updates existing user details (name/avatar). If an organization ID or context is present, ensures the user is linked to the organization. Requires users:write or members:write scope.',
  })
  @ApiBody({ type: V3CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created or provisioned successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden: Missing users:write scope.' })
  async createUser(@V3Context() context: ApiV3Context, @Body() body: V3CreateUserDto) {
    const hasScope =
      context.scopes.includes('users:write') ||
      context.scopes.includes('members:write') ||
      context.scopes.includes('*');

    if (!hasScope) {
      throw new ForbiddenException('Missing users:write or members:write scope');
    }

    if (!body.email) {
      throw new BadRequestException('email is required');
    }

    let isNewUser = false;
    let user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user) {
      isNewUser = true;
      const userName = body.name || body.email.split('@')[0] || body.email;
      user = await prisma.user.create({
        data: {
          email: body.email,
          name: userName,
          avatar: body.avatar || null,
        },
      });
    } else if (body.name || body.avatar) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(body.name ? { name: body.name } : {}),
          ...(body.avatar ? { avatar: body.avatar } : {}),
        },
      });
    }

    const orgId = body.organizationId || context.organizationId;
    if (orgId) {
      const existingOrgMember = await prisma.member.findFirst({
        where: { organizationId: orgId, userId: user.id },
      });
      if (!existingOrgMember) {
        await prisma.member.create({
          data: {
            organizationId: orgId,
            userId: user.id,
            role: 'member',
          },
        });
      }
    }

    if (isNewUser) {
      try {
        const env = validateEnv();
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || (env as any).NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

        let resetPasswordUrl: string;
        try {
          const tokenRes = await auth.api.forgetPassword({
            body: { email: user.email, redirectTo: `${appUrl}/reset-password` },
          });
          resetPasswordUrl = (tokenRes as any)?.url || `${appUrl}/reset-password?email=${encodeURIComponent(user.email)}`;
        } catch (e) {
          resetPasswordUrl = `${appUrl}/reset-password?email=${encodeURIComponent(user.email)}`;
        }

        await sendSetPasswordEmail({
          to: user.email,
          url: resetPasswordUrl,
          user: {
            name: user.name,
            email: user.email,
          },
          isNewUser: true,
        });
      } catch (err) {
        this.logger.error(`Failed to send set password email for ${user.email}`, err);
      }
    }

    return this.formatResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    });
  }

  @Get('by-email')
  @ApiOperation({
    summary: 'Find user by email address (Enterprise M2M)',
    description: 'Retrieves user profile details by email address. Requires users:read or members:read scope.',
  })
  @ApiQuery({ name: 'email', description: 'The email address of the user to query' })
  @ApiResponse({ status: 200, description: 'User profile returned successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async getUserByEmail(@V3Context() context: ApiV3Context, @Query('email') email: string) {
    const hasScope =
      context.scopes.includes('users:read') ||
      context.scopes.includes('members:read') ||
      context.scopes.includes('*');

    if (!hasScope) {
      throw new ForbiddenException('Missing users:read or members:read scope');
    }

    if (!email) {
      throw new BadRequestException('email query parameter is required');
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        status: true,
        isBot: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User with specified email not found');
    }

    return this.formatResponse({ user });
  }

  @Get(':userId')
  @ApiOperation({
    summary: 'Get user by user ID (Enterprise M2M)',
    description: 'Retrieves user profile details by user ID. Requires users:read or members:read scope.',
  })
  @ApiParam({ name: 'userId', description: 'The user ID' })
  @ApiResponse({ status: 200, description: 'User profile returned successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async getUserById(@V3Context() context: ApiV3Context, @Param('userId') userId: string) {
    const hasScope =
      context.scopes.includes('users:read') ||
      context.scopes.includes('members:read') ||
      context.scopes.includes('*');

    if (!hasScope) {
      throw new ForbiddenException('Missing users:read or members:read scope');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        status: true,
        isBot: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.formatResponse({ user });
  }
}

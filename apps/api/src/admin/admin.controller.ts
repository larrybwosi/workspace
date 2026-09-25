import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody, ApiProperty } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { IsString, IsIn, IsObject } from 'class-validator';
import { AdminGuard } from '../auth/admin.guard';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User } from '@repo/database';
import { AdminService } from './admin.service';

/**
 * THREAT MITIGATION: Input Validation & Allowed Role Enforcement
 * Using class-validator DTOs enforces input typing and validates user roles strictly against allowed system roles.
 */
export class UpdateMemberRoleDto {
  @IsString()
  @IsIn(['admin', 'user', 'moderator'])
  @ApiProperty({ example: 'admin', enum: ['admin', 'user', 'moderator'] })
  role!: string;
}

/**
 * THREAT MITIGATION: Mass Assignment & Unvalidated Payload Prevention
 * Enforces explicit field types and allowed asset category identifiers for administrative asset creation and updates.
 */
export class CreateAssetDto {
  @IsString()
  @IsIn(['emoji', 'sticker', 'sound', 'profile_asset'])
  @ApiProperty({ example: 'emoji', enum: ['emoji', 'sticker', 'sound', 'profile_asset'] })
  type!: string;

  @IsObject()
  @ApiProperty({ type: 'object' })
  data!: Record<string, any>;
}

export class UpdateAssetDto {
  @IsString()
  @IsIn(['emoji', 'sticker', 'sound', 'profile_asset'])
  @ApiProperty({ example: 'emoji', enum: ['emoji', 'sticker', 'sound', 'profile_asset'] })
  type!: string;

  @IsString()
  @ApiProperty({ example: 'asset_123' })
  id!: string;

  @IsObject()
  @ApiProperty({ type: 'object' })
  data!: Record<string, any>;
}

@ApiTags('Admin')
@Controller('admin')
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get global system statistics' })
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('members')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get all members across all workspaces' })
  async getMembers(@Query('search') search?: string, @Query('role') role?: string, @Query('status') status?: string) {
    return this.adminService.getMembers({ search, role, status });
  }

  /**
   * THREAT MITIGATION: Admin Self-Demotion Lockout & Invalid Role Prevention
   * Enforces role validation using UpdateMemberRoleDto and blocks self-demotion to prevent
   * administrators from accidentally or maliciously locking themselves out of administrative privileges.
   */
  @Patch('members/:userId/role')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update member role' })
  @ApiBody({ type: UpdateMemberRoleDto })
  async updateMemberRole(
    @CurrentUser() currentUser: User,
    @Param('userId') userId: string,
    @Body() dto: UpdateMemberRoleDto
  ) {
    if (currentUser && currentUser.id === userId && dto.role !== 'admin') {
      throw new BadRequestException('Admins cannot demote their own account');
    }
    return this.adminService.updateMemberRole(userId, dto.role);
  }

  @Get('assets')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get assets by type' })
  async getAssets(@Query('type') type: string) {
    if (!type) {
      throw new BadRequestException('Asset type is required');
    }
    return this.adminService.getAssets(type);
  }

  @Post('assets')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Create a new asset' })
  @ApiBody({ type: CreateAssetDto })
  async createAsset(@Body() dto: CreateAssetDto) {
    return this.adminService.createAsset(dto.type, dto.data);
  }

  @Patch('assets')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update an existing asset' })
  @ApiBody({ type: UpdateAssetDto })
  async updateAsset(@Body() dto: UpdateAssetDto) {
    return this.adminService.updateAsset(dto.type, dto.id, dto.data);
  }

  @Delete('assets')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Delete an asset' })
  async deleteAsset(@Query('type') type: string, @Query('id') id: string) {
    if (!type || !id) {
      throw new BadRequestException('Asset type and ID are required');
    }
    return this.adminService.deleteAsset(type, id);
  }

  @Get('profile-assets')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get profile assets' })
  async getProfileAssets() {
    return this.adminService.getProfileAssets();
  }

  @Get('assets/stats')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get asset statistics' })
  async getAssetStats(@Query('assetId') assetId: string, @Query('assetType') assetType: string) {
    if (!assetId || !assetType) {
      throw new BadRequestException('Asset ID and type are required');
    }
    return this.adminService.getAssetStats(assetId, assetType);
  }

  @Post('profile-assets')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Create a profile asset' })
  async createProfileAsset(@Body() body: any) {
    return this.adminService.createAsset('profile_asset', body, '');
  }

  @Post('upload')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Upload a file to Sanity' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadFile(@Req() req: FastifyRequest) {
    const data = await req.file();
    if (!data) {
      throw new BadRequestException('No file uploaded');
    }
    const buffer = await data.toBuffer();
    const file = {
      buffer,
      originalname: data.filename,
      mimetype: data.mimetype,
      size: buffer.length,
    };
    return this.adminService.uploadFile(file);
  }
}

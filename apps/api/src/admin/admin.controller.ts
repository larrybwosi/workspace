import { 
  Controller, Get, Post, Patch, Delete, Body, Query, Param, 
  UseGuards, Req, BadRequestException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { AdminGuard } from '../auth/admin.guard';
import { AuthGuard } from '../auth/auth.guard';
import { AdminService } from './admin.service';

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

  @Patch('members/:userId/role')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update member role' })
  async updateMemberRole(@Param('userId') userId: string, @Body('role') role: string) {
    return this.adminService.updateMemberRole(userId, role);
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
  async createAsset(@Body() body: { type: string; data: any }) {
    return this.adminService.createAsset(body.type, body.data);
  }

  @Patch('assets')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update an existing asset' })
  async updateAsset(@Body() body: { type: string; id: string; data: any }) {
    return this.adminService.updateAsset(body.type, body.id, body.data);
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
  async getAssetStats(
    @Query('assetId') assetId: string,
    @Query('assetType') assetType: string,
  ) {
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
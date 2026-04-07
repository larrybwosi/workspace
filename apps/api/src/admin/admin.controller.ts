import { Controller, Get, Post, Patch, Delete, Body, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User } from '@repo/database';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('assets')
  @UseGuards(AdminGuard)
  async getAssets(@Query('type') type: string) {
    if (!type) {
      throw new BadRequestException('Asset type is required');
    }
    return this.adminService.getAssets(type);
  }

  @Post('assets')
  @UseGuards(AdminGuard)
  async createAsset(
    @CurrentUser() user: User,
    @Body() body: { type: string; data: any },
  ) {
    return this.adminService.createAsset(body.type, body.data, user.id);
  }

  @Patch('assets')
  @UseGuards(AdminGuard)
  async updateAsset(@Body() body: { type: string; id: string; data: any }) {
    return this.adminService.updateAsset(body.type, body.id, body.data);
  }

  @Delete('assets')
  @UseGuards(AdminGuard)
  async deleteAsset(@Query('type') type: string, @Query('id') id: string) {
    if (!type || !id) {
      throw new BadRequestException('Asset type and ID are required');
    }
    return this.adminService.deleteAsset(type, id);
  }

  @Get('profile-assets')
  @UseGuards(AuthGuard)
  async getProfileAssets() {
    return this.adminService.getProfileAssets();
  }

  @Get('assets/stats')
  @UseGuards(AdminGuard)
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
  async createProfileAsset(@Body() body: any) {
    return this.adminService.createAsset('profile_asset', body, '');
  }
}

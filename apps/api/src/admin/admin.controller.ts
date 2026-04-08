import { Controller, Get, Post, Patch, Delete, Body, Query, Param, UseGuards, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AdminGuard } from '../auth/admin.guard';
import { AdminService } from './admin.service';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(AdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get global system statistics' })
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('members')
  @ApiOperation({ summary: 'Get all members across all workspaces' })
  async getMembers(@Query('search') search?: string, @Query('role') role?: string, @Query('status') status?: string) {
    return this.adminService.getMembers({ search, role, status });
  }

  @Patch('members/:userId/role')
  @ApiOperation({ summary: 'Update member role' })
  async updateMemberRole(@Param('userId') userId: string, @Body('role') role: string) {
    return this.adminService.updateMemberRole(userId, role);
  }

  @Get('assets')
  @ApiOperation({ summary: 'Get assets by type' })
  async getAssets(@Query('type') type: string) {
    return this.adminService.getAssets(type);
  }

  @Post('assets')
  @ApiOperation({ summary: 'Create a new asset' })
  async createAsset(@Body() body: { type: string; data: any }) {
    return this.adminService.createAsset(body.type, body.data);
  }

  @Patch('assets')
  @ApiOperation({ summary: 'Update an existing asset' })
  async updateAsset(@Body() body: { type: string; id: string; data: any }) {
    return this.adminService.updateAsset(body.type, body.id, body.data);
  }

  @Delete('assets')
  @ApiOperation({ summary: 'Delete an asset' })
  async deleteAsset(@Query('type') type: string, @Query('id') id: string) {
    return this.adminService.deleteAsset(type, id);
  }

  @Post('upload')
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
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: any) {
    return this.adminService.uploadFile(file);
  }
}

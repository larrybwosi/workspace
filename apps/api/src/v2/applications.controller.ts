import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiV2Guard, ApiV2Context } from '../auth/api-v2.guard';
import { V2Context } from '../auth/v2-context.decorator';
import { V2ApplicationsService } from './applications.service';

@Controller('v2/applications')
@UseGuards(ApiV2Guard)
export class V2ApplicationsController {
  constructor(private readonly applicationsService: V2ApplicationsService) {}

  @Post()
  async createApplication(@V2Context() context: ApiV2Context, @Body() body: { name: string; description?: string }) {
    return this.applicationsService.createApplication(context.userId, body);
  }

  @Get()
  async getApplications(@V2Context() context: ApiV2Context) {
    return this.applicationsService.getApplications(context.userId);
  }

  @Get(':id')
  async getApplication(@V2Context() context: ApiV2Context, @Param('id') id: string) {
    return this.applicationsService.getApplication(context.userId, id);
  }

  @Post(':id/install')
  async installBot(
    @V2Context() context: ApiV2Context,
    @Param('id') id: string,
    @Body() body: { workspaceId: string },
  ) {
    return this.applicationsService.installBot(context.userId, id, body.workspaceId);
  }
}

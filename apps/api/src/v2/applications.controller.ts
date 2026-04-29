import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiProperty,
} from '@nestjs/swagger';
import { ApiV2Guard, ApiV2Context } from '../auth/api-v2.guard';
import { V2Context } from '../auth/v2-context.decorator';
import { V2ApplicationsService } from './applications.service';

class CreateApplicationDto {
  @ApiProperty({ example: 'My Bot' })
  name: string;
  @ApiProperty({ required: false })
  description?: string;
}

class UpdateApplicationDto {
  @ApiProperty({ required: false })
  name?: string;
  @ApiProperty({ required: false })
  description?: string;
  @ApiProperty({ required: false })
  channelDefinitions?: any;
}

@ApiTags('Bot Applications')
@ApiBearerAuth()
@Controller('v2/applications')
@UseGuards(ApiV2Guard)
export class V2ApplicationsController {
  constructor(private readonly applicationsService: V2ApplicationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new bot application', description: 'Requires an authenticated user.' })
  @ApiBody({ type: CreateApplicationDto })
  @ApiResponse({ status: 201, description: 'Application created successfully.' })
  async createApplication(@V2Context() context: ApiV2Context, @Body() body: CreateApplicationDto) {
    return this.applicationsService.createApplication(context.userId, body);
  }

  @Get()
  @ApiOperation({ summary: 'List all bot applications owned by the user' })
  @ApiResponse({ status: 200, description: 'List of applications returned successfully.' })
  async getApplications(@V2Context() context: ApiV2Context) {
    return this.applicationsService.getApplications(context.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific bot application' })
  @ApiParam({ name: 'id', description: 'The application ID' })
  @ApiResponse({ status: 200, description: 'Application details returned successfully.' })
  async getApplication(@V2Context() context: ApiV2Context, @Param('id') id: string) {
    return this.applicationsService.getApplication(context.userId, id);
  }

  @Post(':id')
  @ApiOperation({ summary: 'Update a bot application' })
  @ApiParam({ name: 'id', description: 'The application ID' })
  @ApiBody({ type: UpdateApplicationDto })
  @ApiResponse({ status: 200, description: 'Application updated successfully.' })
  async updateApplication(
    @V2Context() context: ApiV2Context,
    @Param('id') id: string,
    @Body() body: UpdateApplicationDto,
  ) {
    return this.applicationsService.updateApplication(context.userId, id, body);
  }

  @Post(':id/delete')
  @ApiOperation({ summary: 'Delete a bot application' })
  @ApiParam({ name: 'id', description: 'The application ID' })
  @ApiResponse({ status: 200, description: 'Application deleted successfully.' })
  async deleteApplication(@V2Context() context: ApiV2Context, @Param('id') id: string) {
    return this.applicationsService.deleteApplication(context.userId, id);
  }

  @Post(':id/reset-token')
  @ApiOperation({ summary: 'Reset the bot user token' })
  @ApiParam({ name: 'id', description: 'The application ID' })
  @ApiResponse({ status: 200, description: 'Token reset successfully.' })
  async resetBotToken(@V2Context() context: ApiV2Context, @Param('id') id: string) {
    return this.applicationsService.resetBotToken(context.userId, id);
  }

  @Post(':id/install')
  @ApiOperation({ summary: 'Install the bot into a workspace' })
  @ApiParam({ name: 'id', description: 'The application ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Bot installed successfully.' })
  async installBot(
    @V2Context() context: ApiV2Context,
    @Param('id') id: string,
    @Body() body: { workspaceId: string },
  ) {
    return this.applicationsService.installBot(context.userId, id, body.workspaceId);
  }
}

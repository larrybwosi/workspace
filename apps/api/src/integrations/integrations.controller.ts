import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiProperty } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User } from '@repo/database';
import { IntegrationsService } from './integrations.service';
import { z } from 'zod';
import { IsString, IsArray, IsUrl, IsEnum, IsOptional, IsObject } from 'class-validator';

const createWebhookSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  events: z.array(z.string()).min(1),
});

const createIntegrationSchema = z.object({
  service: z.enum([
    'slack',
    'github',
    'gitlab',
    'jira',
    'linear',
    'notion',
    'figma',
    'discord',
    'teams',
    'zapier',
    'make',
    'custom',
    'huly',
  ]),
  name: z.string().min(1).max(100),
  config: z.object({
    webhookUrl: z.string().url().optional(),
    hulyUrl: z.string().url().optional(),
    apiKey: z.string().optional(),
    accessToken: z.string().optional(),
    refreshToken: z.string().optional(),
    channelId: z.string().optional(),
    repositoryId: z.string().optional(),
    projectId: z.string().optional(),
    teamId: z.string().optional(),
    scopes: z.array(z.string()).optional(),
    customHeaders: z.any().optional(),
    events: z.array(z.string()).optional(),
  }),
  description: z.string().optional(),
});

class CreateIntegrationWebhookDto {
  @IsString()
  @ApiProperty({ example: 'My Integration Webhook' })
  name: string;

  @IsUrl()
  @ApiProperty({ example: 'https://example.com/webhook' })
  url: string;

  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ type: [String], example: ['event.name'] })
  events: string[];
}

@ApiTags('Integrations')
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Post('plane/webhook')
  @ApiOperation({ summary: 'Handle Plane webhook' })
  async handlePlaneWebhook(@Body() body: any) {
    return this.integrationsService.handlePlaneWebhook(body);
  }

  @Post('huly/webhook/:id')
  @ApiOperation({ summary: 'Handle Huly webhook' })
  @ApiParam({ name: 'id', description: 'The webhook ID' })
  async handleHulyWebhook(@Param('id') id: string, @Body() body: any) {
    return this.integrationsService.handleHulyWebhook(id, body);
  }

  @Get('stats')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get integration statistics' })
  @ApiResponse({ status: 200, description: 'Integration statistics' })
  async getStats(@CurrentUser() user: User) {
    return this.integrationsService.getStats(user.id);
  }

  @Get('webhooks')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get all integration webhooks' })
  @ApiResponse({ status: 200, description: 'List of webhooks' })
  async getWebhooks(@CurrentUser() user: User) {
    return this.integrationsService.getWebhooks(user.id);
  }

  @Post('webhooks')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Create an integration webhook' })
  @ApiBody({ type: CreateIntegrationWebhookDto })
  @ApiResponse({ status: 201, description: 'Webhook created successfully' })
  async createWebhook(@CurrentUser() user: User, @Body() body: CreateIntegrationWebhookDto) {
    const validatedData = createWebhookSchema.parse(body);
    return this.integrationsService.createWebhook(user.id, validatedData);
  }

  @Patch('webhooks/:webhookId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update an integration webhook' })
  @ApiParam({ name: 'webhookId', description: 'The webhook ID' })
  @ApiResponse({ status: 200, description: 'Webhook updated' })
  async updateWebhook(@CurrentUser() user: User, @Param('webhookId') webhookId: string, @Body() body: any) {
    return this.integrationsService.updateWebhook(user.id, webhookId, body);
  }

  @Delete('webhooks/:webhookId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Delete an integration webhook' })
  @ApiParam({ name: 'webhookId', description: 'The webhook ID' })
  @ApiResponse({ status: 200, description: 'Webhook deleted' })
  async deleteWebhook(@CurrentUser() user: User, @Param('webhookId') webhookId: string) {
    return this.integrationsService.deleteWebhook(user.id, webhookId);
  }

  @Get('webhooks/:webhookId/logs')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get integration webhook logs' })
  @ApiParam({ name: 'webhookId', description: 'The webhook ID' })
  @ApiResponse({ status: 200, description: 'Webhook logs' })
  async getWebhookLogs(@CurrentUser() user: User, @Param('webhookId') webhookId: string) {
    return this.integrationsService.getWebhookLogs(user.id, webhookId);
  }

  @Get('api-keys')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get all integration API keys' })
  @ApiResponse({ status: 200, description: 'List of API keys' })
  async getApiKeys(@CurrentUser() user: User) {
    return this.integrationsService.getApiKeys(user.id);
  }

  @Patch('api-keys/:keyId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update an integration API key' })
  @ApiParam({ name: 'keyId', description: 'The key ID' })
  @ApiResponse({ status: 200, description: 'API key updated' })
  async updateApiKey(@CurrentUser() user: User, @Param('keyId') keyId: string, @Body() body: any) {
    return this.integrationsService.updateApiKey(user.id, keyId, body);
  }

  @Delete('api-keys/:keyId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Delete an integration API key' })
  @ApiParam({ name: 'keyId', description: 'The key ID' })
  @ApiResponse({ status: 200, description: 'API key deleted' })
  async deleteApiKey(@CurrentUser() user: User, @Param('keyId') keyId: string) {
    return this.integrationsService.deleteApiKey(user.id, keyId);
  }
}

class CreateIntegrationDto {
  @IsEnum([
    'slack',
    'github',
    'gitlab',
    'jira',
    'linear',
    'notion',
    'figma',
    'discord',
    'teams',
    'zapier',
    'make',
    'custom',
    'huly',
  ])
  @ApiProperty({
    enum: [
      'slack',
      'github',
      'gitlab',
      'jira',
      'linear',
      'notion',
      'figma',
      'discord',
      'teams',
      'zapier',
      'make',
      'custom',
      'huly',
    ],
    example: 'github',
  })
  service: string;

  @IsString()
  @ApiProperty({ example: 'My GitHub Integration' })
  name: string;

  @IsObject()
  @ApiProperty({
    type: 'object',
    properties: {
      webhookUrl: { type: 'string' },
      hulyUrl: { type: 'string' },
      apiKey: { type: 'string' },
      accessToken: { type: 'string' },
      refreshToken: { type: 'string' },
      channelId: { type: 'string' },
      repositoryId: { type: 'string' },
      projectId: { type: 'string' },
      teamId: { type: 'string' },
      scopes: { type: 'array', items: { type: 'string' } },
      customHeaders: { type: 'object', additionalProperties: true },
      events: { type: 'array', items: { type: 'string' } },
    },
  })
  config: any;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, example: 'Integration with GitHub' })
  description?: string;
}

@ApiTags('Workspace Integrations')
@ApiBearerAuth()
@Controller('workspaces/:slug/integrations')
@UseGuards(AuthGuard)
export class WorkspaceIntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all integrations for a workspace' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiResponse({ status: 200, description: 'List of integrations' })
  async getWorkspaceIntegrations(@CurrentUser() user: User, @Param('slug') slug: string) {
    return this.integrationsService.getWorkspaceIntegrations(user.id, slug);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new integration for a workspace' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiBody({ type: CreateIntegrationDto })
  @ApiResponse({ status: 201, description: 'Integration created successfully' })
  async createWorkspaceIntegration(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Body() body: CreateIntegrationDto
  ) {
    const validatedData = createIntegrationSchema.parse(body);
    return this.integrationsService.createWorkspaceIntegration(user.id, slug, validatedData);
  }

  @Get(':integrationId')
  @ApiOperation({ summary: 'Get integration details' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'integrationId', description: 'The integration ID' })
  @ApiResponse({ status: 200, description: 'Integration details' })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  async getWorkspaceIntegration(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('integrationId') integrationId: string
  ) {
    return this.integrationsService.getWorkspaceIntegration(user.id, slug, integrationId);
  }

  @Patch(':integrationId')
  @ApiOperation({ summary: 'Update an integration' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'integrationId', description: 'The integration ID' })
  @ApiResponse({ status: 200, description: 'Integration updated' })
  async updateWorkspaceIntegration(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('integrationId') integrationId: string,
    @Body() body: any
  ) {
    return this.integrationsService.updateWorkspaceIntegration(user.id, slug, integrationId, body);
  }

  @Delete(':integrationId')
  @ApiOperation({ summary: 'Delete an integration' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'integrationId', description: 'The integration ID' })
  @ApiResponse({ status: 200, description: 'Integration deleted' })
  async deleteWorkspaceIntegration(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('integrationId') integrationId: string
  ) {
    return this.integrationsService.deleteWorkspaceIntegration(user.id, slug, integrationId);
  }

  @Post(':integrationId/test')
  @ApiOperation({ summary: 'Test an integration' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'integrationId', description: 'The integration ID' })
  @ApiResponse({ status: 201, description: 'Test successful' })
  async testWorkspaceIntegration(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('integrationId') integrationId: string
  ) {
    return this.integrationsService.testWorkspaceIntegration(user.id, slug, integrationId);
  }

  @Get('webhooks')
  @ApiOperation({ summary: 'Get all integration webhooks for a workspace' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiResponse({ status: 200, description: 'List of webhooks' })
  async getWorkspaceWebhooks(@CurrentUser() user: User, @Param('slug') slug: string) {
    return this.integrationsService.getWorkspaceWebhooks(user.id, slug);
  }

  @Post('webhooks')
  @ApiOperation({ summary: 'Create an integration webhook for a workspace' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiBody({ type: CreateIntegrationWebhookDto })
  @ApiResponse({ status: 201, description: 'Webhook created successfully' })
  async createWorkspaceWebhook(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Body() body: CreateIntegrationWebhookDto
  ) {
    const validatedData = createWebhookSchema.parse(body);
    return this.integrationsService.createWorkspaceWebhook(user.id, slug, validatedData);
  }
}

import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, BadRequestException, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User } from '@repo/database';
import { IntegrationsService } from './integrations.service';
import { z } from 'zod';

const createWebhookSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  events: z.array(z.string()).min(1),
});

const createIntegrationSchema = z.object({
  service: z.enum([
    "slack", "github", "gitlab", "jira", "linear", "notion",
    "figma", "discord", "teams", "zapier", "make", "custom",
  ]),
  name: z.string().min(1).max(100),
  config: z.object({
    webhookUrl: z.string().url().optional(),
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

@Controller('integrations')
export class IntegrationsController {
  constructor(
    private readonly integrationsService: IntegrationsService,
  ) {}

  @Post('plane/webhook')
  async handlePlaneWebhook(@Body() body: any) {
    return this.integrationsService.handlePlaneWebhook(body);
  }

  @Get('stats')
  @UseGuards(AuthGuard)
  async getStats(@CurrentUser() user: User) {
    return this.integrationsService.getStats(user.id);
  }

  @Get('webhooks')
  @UseGuards(AuthGuard)
  async getWebhooks(@CurrentUser() user: User) {
    return this.integrationsService.getWebhooks(user.id);
  }

  @Post('webhooks')
  @UseGuards(AuthGuard)
  async createWebhook(@CurrentUser() user: User, @Body() body: any) {
    const validatedData = createWebhookSchema.parse(body);
    return this.integrationsService.createWebhook(user.id, validatedData);
  }

  @Patch('webhooks/:webhookId')
  @UseGuards(AuthGuard)
  async updateWebhook(@CurrentUser() user: User, @Param('webhookId') webhookId: string, @Body() body: any) {
    return this.integrationsService.updateWebhook(user.id, webhookId, body);
  }

  @Delete('webhooks/:webhookId')
  @UseGuards(AuthGuard)
  async deleteWebhook(@CurrentUser() user: User, @Param('webhookId') webhookId: string) {
    return this.integrationsService.deleteWebhook(user.id, webhookId);
  }

  @Get('webhooks/:webhookId/logs')
  @UseGuards(AuthGuard)
  async getWebhookLogs(@CurrentUser() user: User, @Param('webhookId') webhookId: string) {
    return this.integrationsService.getWebhookLogs(user.id, webhookId);
  }

  @Get('api-keys')
  @UseGuards(AuthGuard)
  async getApiKeys(@CurrentUser() user: User) {
    return this.integrationsService.getApiKeys(user.id);
  }

  @Patch('api-keys/:keyId')
  @UseGuards(AuthGuard)
  async updateApiKey(@CurrentUser() user: User, @Param('keyId') keyId: string, @Body() body: any) {
    return this.integrationsService.updateApiKey(user.id, keyId, body);
  }

  @Delete('api-keys/:keyId')
  @UseGuards(AuthGuard)
  async deleteApiKey(@CurrentUser() user: User, @Param('keyId') keyId: string) {
    return this.integrationsService.deleteApiKey(user.id, keyId);
  }
}

@Controller('workspaces/:slug/integrations')
@UseGuards(AuthGuard)
export class WorkspaceIntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  async getWorkspaceIntegrations(@CurrentUser() user: User, @Param('slug') slug: string) {
    return this.integrationsService.getWorkspaceIntegrations(user.id, slug);
  }

  @Post()
  async createWorkspaceIntegration(@CurrentUser() user: User, @Param('slug') slug: string, @Body() body: any) {
    const validatedData = createIntegrationSchema.parse(body);
    return this.integrationsService.createWorkspaceIntegration(user.id, slug, validatedData);
  }

  @Get(':integrationId')
  async getWorkspaceIntegration(@CurrentUser() user: User, @Param('slug') slug: string, @Param('integrationId') integrationId: string) {
    return this.integrationsService.getWorkspaceIntegration(user.id, slug, integrationId);
  }

  @Patch(':integrationId')
  async updateWorkspaceIntegration(@CurrentUser() user: User, @Param('slug') slug: string, @Param('integrationId') integrationId: string, @Body() body: any) {
    return this.integrationsService.updateWorkspaceIntegration(user.id, slug, integrationId, body);
  }

  @Delete(':integrationId')
  async deleteWorkspaceIntegration(@CurrentUser() user: User, @Param('slug') slug: string, @Param('integrationId') integrationId: string) {
    return this.integrationsService.deleteWorkspaceIntegration(user.id, slug, integrationId);
  }

  @Post(':integrationId/test')
  async testWorkspaceIntegration(@CurrentUser() user: User, @Param('slug') slug: string, @Param('integrationId') integrationId: string) {
    return this.integrationsService.testWorkspaceIntegration(user.id, slug, integrationId);
  }

  @Get('webhooks')
  async getWorkspaceWebhooks(@CurrentUser() user: User, @Param('slug') slug: string) {
    return this.integrationsService.getWorkspaceWebhooks(user.id, slug);
  }

  @Post('webhooks')
  async createWorkspaceWebhook(@CurrentUser() user: User, @Param('slug') slug: string, @Body() body: any) {
    const validatedData = createWebhookSchema.parse(body);
    return this.integrationsService.createWorkspaceWebhook(user.id, slug, validatedData);
  }
}

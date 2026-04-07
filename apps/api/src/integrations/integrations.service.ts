import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { prisma, User } from '@repo/database';
import { z } from 'zod';
import * as crypto from 'crypto';
import { SystemMessagesService } from '../common/system-messages.service';

export const INTEGRATION_METADATA = {
  slack: {
    name: "Slack",
    icon: "slack",
    color: "#4A154B",
    events: ["message.created", "task.created", "task.completed", "project.created", "member.joined"],
    scopes: ["chat:write", "channels:read", "users:read"],
  },
  github: {
    name: "GitHub",
    icon: "github",
    color: "#24292E",
    events: ["commit.pushed", "pr.created", "pr.merged", "issue.created", "release.published"],
    scopes: ["repo", "read:user", "workflow"],
  },
  gitlab: {
    name: "GitLab",
    icon: "gitlab",
    color: "#FC6D26",
    events: ["commit.pushed", "mr.created", "mr.merged", "issue.created", "pipeline.completed"],
    scopes: ["api", "read_user", "read_repository"],
  },
  jira: {
    name: "Jira",
    icon: "jira",
    color: "#0052CC",
    events: ["issue.created", "issue.updated", "issue.resolved", "sprint.started", "sprint.completed"],
    scopes: ["read:jira-work", "write:jira-work"],
  },
  linear: {
    name: "Linear",
    icon: "linear",
    color: "#5E6AD2",
    events: ["issue.created", "issue.updated", "issue.completed", "cycle.started", "cycle.completed"],
    scopes: ["read", "write", "issues:create"],
  },
  notion: {
    name: "Notion",
    icon: "notion",
    color: "#000000",
    events: ["page.created", "page.updated", "database.updated"],
    scopes: ["read_content", "update_content", "insert_content"],
  },
  figma: {
    name: "Figma",
    icon: "figma",
    color: "#F24E1E",
    events: ["file.updated", "comment.created", "version.published"],
    scopes: ["file_read", "file_comments:write"],
  },
  discord: {
    name: "Discord",
    icon: "discord",
    color: "#5865F2",
    events: ["message.created", "task.created", "task.completed", "alert.triggered"],
    scopes: ["bot", "applications.commands"],
  },
  teams: {
    name: "Microsoft Teams",
    icon: "teams",
    color: "#6264A7",
    events: ["message.created", "task.created", "meeting.scheduled", "alert.triggered"],
    scopes: ["ChannelMessage.Send", "Chat.ReadWrite"],
  },
  zapier: {
    name: "Zapier",
    icon: "zapier",
    color: "#FF4A00",
    events: ["*"],
    scopes: [],
  },
  make: {
    name: "Make (Integromat)",
    icon: "make",
    color: "#6D00CC",
    events: ["*"],
    scopes: [],
  },
  custom: {
    name: "Custom Webhook",
    icon: "webhook",
    color: "#6366F1",
    events: ["*"],
    scopes: [],
  },
};

@Injectable()
export class IntegrationsService {
  constructor(private readonly systemMessagesService: SystemMessagesService) {}

  async handlePlaneWebhook(body: any) {
    const { event, data, workspaceId } = body;

    const channel = await prisma.channel.findFirst({
      where: { workspaceId: workspaceId as string },
    });

    if (!channel) throw new NotFoundException('Channel not found');

    let message = '';
    switch (event) {
      case 'issue.created':
        message = `🚀 Issue created in Plane: **${data.name}**`;
        break;
      case 'issue.updated':
        message = `🔄 Issue updated in Plane: **${data.name}** (Status: ${data.state})`;
        break;
      default:
        message = `🔗 Plane integration update: ${event}`;
    }

    await this.systemMessagesService.createSystemMessage(message, {
      channelId: channel.id,
      metadata: { source: 'plane', event, data },
      broadcast: true,
    });

    return { success: true };
  }

  async getStats(userId: string) {
    const [activeKeys, totalKeys] = await Promise.all([
      prisma.apiKey.count({
        where: { userId, isActive: true },
      }),
      prisma.apiKey.count({
        where: { userId },
      }),
    ]);

    const [activeWebhooks, totalWebhooks] = await Promise.all([
      prisma.webhook.count({
        where: { userId, isActive: true },
      }),
      prisma.webhook.count({
        where: { userId },
      }),
    ]);

    const recentLogs = await prisma.webhookLog.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      where: {
        webhook: { userId },
      },
    });

    const successRate = recentLogs.length > 0
      ? Math.round((recentLogs.filter(log => log.success).length / recentLogs.length) * 100)
      : 0;

    return {
      activeKeys,
      totalKeys,
      activeWebhooks,
      totalWebhooks,
      apiCalls24h: 0,
      rateLimitUsage: 0,
      webhookSuccessRate: successRate,
    };
  }

  async getWebhooks(userId: string) {
    return prisma.webhook.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createWebhook(userId: string, data: { name: string; url: string; events: string[] }) {
    const secret = crypto.randomBytes(32).toString('hex');
    return prisma.webhook.create({
      data: {
        ...data,
        secret,
        userId,
      },
    });
  }

  async updateWebhook(userId: string, webhookId: string, data: any) {
    return prisma.webhook.update({
      where: { id: webhookId, userId },
      data,
    });
  }

  async deleteWebhook(userId: string, webhookId: string) {
    await prisma.webhook.delete({
      where: { id: webhookId, userId },
    });
    return { success: true };
  }

  async getWebhookLogs(userId: string, webhookId: string) {
    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId, userId },
    });

    if (!webhook) throw new NotFoundException('Webhook not found');

    return prisma.webhookLog.findMany({
      where: { webhookId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getApiKeys(userId: string) {
     return prisma.apiKey.findMany({
       where: { userId },
       orderBy: { createdAt: 'desc' },
     });
  }

  async updateApiKey(userId: string, keyId: string, data: any) {
    return prisma.apiKey.update({
      where: { id: keyId, userId },
      data,
    });
  }

  async deleteApiKey(userId: string, keyId: string) {
    await prisma.apiKey.delete({
      where: { id: keyId, userId },
    });
    return { success: true };
  }

  async getWorkspaceIntegrations(userId: string, workspaceSlug: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: workspaceSlug },
    });

    if (!workspace) throw new NotFoundException('Workspace not found');

    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId } },
    });

    if (!member) throw new ForbiddenException('Forbidden');

    const integrations = await prisma.workspaceIntegration.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: 'desc' },
    });

    const enrichedIntegrations = integrations.map((integration) => {
      const config = integration.config as Record<string, any>;
      const metadata = INTEGRATION_METADATA[integration.service as keyof typeof INTEGRATION_METADATA];

      return {
        ...integration,
        metadata,
        config: {
          ...config,
          apiKey: config.apiKey ? `${config.apiKey.slice(0, 8)}...` : undefined,
          accessToken: config.accessToken ? "••••••••" : undefined,
          refreshToken: undefined,
        },
      };
    });

    return {
      integrations: enrichedIntegrations,
      availableServices: Object.entries(INTEGRATION_METADATA).map(([key, value]) => ({
        id: key,
        ...value,
      })),
    };
  }

  async createWorkspaceIntegration(userId: string, workspaceSlug: string, data: any) {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: workspaceSlug },
    });

    if (!workspace) throw new NotFoundException('Workspace not found');

    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId } },
    });

    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new ForbiddenException('Forbidden - Admin access required');
    }

    const secret = crypto.randomBytes(32).toString('hex');

    const integration = await prisma.workspaceIntegration.create({
      data: {
        workspaceId: workspace.id,
        service: data.service,
        config: {
          ...data.config,
          secret,
          name: data.name,
          description: data.description,
        } as any,
        active: true,
      },
    });

    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId: workspace.id,
        userId,
        action: 'integration.created',
        resource: 'integration',
        resourceId: integration.id,
        metadata: {
          service: data.service,
          name: data.name,
        },
      },
    });

    return {
      ...integration,
      secret,
      message: "Integration created. Store the secret securely - it won't be shown again.",
    };
  }

  async getWorkspaceIntegration(userId: string, workspaceSlug: string, integrationId: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: workspaceSlug },
    });

    if (!workspace) throw new NotFoundException('Workspace not found');

    const integration = await prisma.workspaceIntegration.findFirst({
      where: { id: integrationId, workspaceId: workspace.id },
    });

    if (!integration) throw new NotFoundException('Integration not found');

    return integration;
  }

  async updateWorkspaceIntegration(userId: string, workspaceSlug: string, integrationId: string, data: any) {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: workspaceSlug },
    });

    if (!workspace) throw new NotFoundException('Workspace not found');

    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId } },
    });

    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new ForbiddenException('Forbidden');
    }

    const integration = await prisma.workspaceIntegration.update({
      where: { id: integrationId },
      data: {
        ...(data.config && { config: data.config }),
        ...(typeof data.active === 'boolean' && { active: data.active }),
      },
    });

    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId: workspace.id,
        userId,
        action: 'integration.updated',
        resource: 'integration',
        resourceId: integrationId,
        metadata: data,
      },
    });

    return integration;
  }

  async deleteWorkspaceIntegration(userId: string, workspaceSlug: string, integrationId: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: workspaceSlug },
    });

    if (!workspace) throw new NotFoundException('Workspace not found');

    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId } },
    });

    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new ForbiddenException('Forbidden');
    }

    await prisma.workspaceIntegration.delete({
      where: { id: integrationId },
    });

    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId: workspace.id,
        userId,
        action: 'integration.deleted',
        resource: 'integration',
        resourceId: integrationId,
      },
    });

    return { success: true };
  }

  async testWorkspaceIntegration(userId: string, workspaceSlug: string, integrationId: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: workspaceSlug },
    });

    if (!workspace) throw new NotFoundException('Workspace not found');

    const integration = await prisma.workspaceIntegration.findFirst({
      where: { id: integrationId, workspaceId: workspace.id },
    });

    if (!integration) throw new NotFoundException('Integration not found');

    const config = integration.config as Record<string, any>;
    let testResult = { success: false, message: '', latency: 0 };
    const startTime = Date.now();

    try {
      switch (integration.service) {
        case 'slack':
          if (config.webhookUrl) {
            const response = await fetch(config.webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: 'Test message from Workspace - Integration is working!',
                attachments: [
                  {
                    color: '#36a64f',
                    title: 'Integration Test',
                    text: 'This is a test message to verify your Slack integration.',
                    footer: 'Workspace Integration',
                    ts: Math.floor(Date.now() / 1000),
                  },
                ],
              }),
            });
            testResult = {
              success: response.ok,
              message: response.ok ? 'Slack webhook is working' : 'Slack webhook failed',
              latency: Date.now() - startTime,
            };
          }
          break;
        case 'discord':
          if (config.webhookUrl) {
            const response = await fetch(config.webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                content: 'Test message from Workspace - Integration is working!',
                embeds: [
                  {
                    title: 'Integration Test',
                    description: 'This is a test message to verify your Discord integration.',
                    color: 0x5865f2,
                    timestamp: new Date().toISOString(),
                  },
                ],
              }),
            });
            testResult = {
              success: response.ok,
              message: response.ok ? 'Discord webhook is working' : 'Discord webhook failed',
              latency: Date.now() - startTime,
            };
          }
          break;
        case 'custom':
          if (config.webhookUrl) {
            const response = await fetch(config.webhookUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(config.customHeaders || {}),
              },
              body: JSON.stringify({
                event: 'integration.test',
                timestamp: new Date().toISOString(),
                data: { message: 'Test message from Workspace' },
              }),
            });
            testResult = {
              success: response.ok,
              message: response.ok ? 'Custom webhook is working' : 'Custom webhook failed',
              latency: Date.now() - startTime,
            };
          }
          break;
        default:
          testResult = {
            success: true,
            message: `Integration ${integration.service} configured`,
            latency: Date.now() - startTime,
          };
      }
    } catch (err) {
      testResult = {
        success: false,
        message: `Connection failed: ${(err as Error).message}`,
        latency: Date.now() - startTime,
      };
    }

    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId: workspace.id,
        userId,
        action: 'integration.tested',
        resource: 'integration',
        resourceId: integrationId,
        metadata: testResult as any,
      },
    });

    return testResult;
  }

  async getWorkspaceWebhooks(userId: string, workspaceSlug: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: workspaceSlug },
    });

    if (!workspace) throw new NotFoundException('Workspace not found');

    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId } },
    });

    if (!member) throw new ForbiddenException('Forbidden');

    return prisma.workspaceWebhook.findMany({
      where: { workspaceId: workspace.id },
      include: {
        _count: {
          select: {
            logs: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createWorkspaceWebhook(userId: string, workspaceSlug: string, data: { name: string; url: string; events: string[] }) {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: workspaceSlug },
    });

    if (!workspace) throw new NotFoundException('Workspace not found');

    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId } },
    });

    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new ForbiddenException('Forbidden');
    }

    const secret = crypto.randomBytes(32).toString('hex');

    return prisma.workspaceWebhook.create({
      data: {
        workspaceId: workspace.id,
        name: data.name,
        url: data.url,
        secret,
        events: data.events,
      },
    });
  }
}

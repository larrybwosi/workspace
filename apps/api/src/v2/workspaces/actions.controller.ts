import { Controller, Post, Param, UseGuards, NotFoundException, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { ApiV2Guard } from '../../auth/api-v2.guard';
import type { ApiV2Context } from '../../auth/api-v2.guard';
import { V2Context } from '../../auth/v2-context.decorator';
import { V2AuditService } from '../v2-audit.service';
import { V2WebhooksService } from '../v2-webhooks.service';
import { IntegrationsService } from '../../integrations/integrations.service';
import { PrismaService } from '../../prisma.service';
import { AblyChannels, AblyEvents, publishRealtime } from '@repo/shared/server';

@ApiTags('Message Actions')
@ApiBearerAuth()
@Controller('v2/workspaces/:slug/messages/:messageId/actions/:actionId')
@UseGuards(ApiV2Guard)
export class V2MessageActionsController {
  constructor(
    private readonly auditService: V2AuditService,
    private readonly webhooksService: V2WebhooksService,
    private readonly integrationsService: IntegrationsService,
    private readonly prisma: PrismaService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Trigger a message action', description: 'Requires messages:send scope.' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'messageId', description: 'The message ID' })
  @ApiParam({ name: 'actionId', description: 'The custom action ID defined in the message' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        formState: { type: 'object', additionalProperties: true },
        payload: { type: 'object', additionalProperties: true },
      },
    },
    required: false,
  })
  @ApiResponse({ status: 200, description: 'Action triggered successfully.' })
  async handleAction(
    @V2Context() context: ApiV2Context,
    @Param('messageId') messageId: string,
    @Param('actionId') actionId: string,
    @Body() body: any
  ) {
    const { message, action } = await this.validateActionRequest(context, messageId, actionId);

    const response = await this.prisma.client.messageActionResponse.create({
      data: {
        messageId,
        actionId: action.id,
        userId: context.userId,
        actionValue: action.value || action.label,
      },
    });

    await this.auditService.log(context, 'messages.action', 'message_action', action.id, { messageId, actionId });

    await this.handleIntegrationActions(context, message, actionId);

    const eventData = {
      messageId,
      actionId,
      actionValue: action.value || action.label,
      userId: context.userId,
      responseId: response.id,
      metadata: message.metadata,
      formState: body?.formState || {},
      payload: body?.payload || {},
    };

    await this.webhooksService.dispatch(message.channel.workspaceId!, 'message.action', eventData);

    const resultBody = await this.processM2mCallbacks(message, eventData);

    return {
      success: true,
      responseId: response.id,
      ...(resultBody || {})
    };
  }

  private async validateActionRequest(context: ApiV2Context, messageId: string, actionId: string) {
    const message = await this.prisma.client.message.findFirst({
      where: {
        id: messageId,
        channel: { workspaceId: context.workspaceId },
      },
      include: { actions: true, channel: true },
    });

    if (!message) {
      throw new NotFoundException('Message not found or access denied');
    }

    const action = message.actions.find(a => a.actionId === actionId);
    if (!action) {
      throw new NotFoundException('Action not found');
    }

    return { message, action };
  }

  private async handleIntegrationActions(context: ApiV2Context, message: any, actionId: string) {
    if (actionId === 'create-huly-task') {
      try {
        await this.integrationsService.createHulyTask(context.workspaceId, {
          title: `Task from message: ${message.content.slice(0, 50)}...`,
          description: `Message: ${message.content}\n\nLink: /workspace/${context.workspaceId}/channels/${message.channelId}/messages/${message.id}`,
        });
      } catch (err) {
        console.error('Failed to create Huly task:', err);
      }
    }
  }

  private async processM2mCallbacks(message: any, eventData: any) {
    const m2mClientId = (message.metadata as any)?.m2mClientId;
    if (!m2mClientId) return null;

    const m2mApp = await this.prisma.client.botApplication.findUnique({
      where: { clientId: m2mClientId },
    });

    if (!m2mApp) return null;

    const m2mResponse = await this.webhooksService.dispatchM2mCallback(
      m2mApp,
      'message.action',
      eventData,
      message.channel.workspaceId!
    );

    if (m2mResponse && (m2mResponse.metadata || m2mResponse.content)) {
      const updatedMessage = await this.applyM2mUpdate(message.id, message.channelId, message.metadata, m2mResponse);
      return { message: updatedMessage };
    }

    return null;
  }

  private async applyM2mUpdate(messageId: string, channelId: string, oldMetadata: any, m2mResponse: any) {
    const updatedMessage = await this.prisma.client.message.update({
      where: { id: messageId },
      data: {
        metadata: m2mResponse.metadata ? { ...(oldMetadata as any), ...m2mResponse.metadata } : undefined,
        content: m2mResponse.content || undefined,
      },
      include: {
        attachments: true,
        actions: true,
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    await publishRealtime(AblyChannels.channel(channelId), AblyEvents.MESSAGE_UPDATED, updatedMessage);

    return updatedMessage;
  }
}

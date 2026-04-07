import {
  Controller,
  Post,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiV2Guard } from '../../auth/api-v2.guard';
import type { ApiV2Context } from '../../auth/api-v2.guard';
import { V2Context } from '../../auth/v2-context.decorator';
import { prisma } from '@repo/database';
import { V2AuditService } from '../v2-audit.service';
import { V2WebhooksService } from '../v2-webhooks.service';

@Controller('v2/messages/:messageId/actions/:actionId')
@UseGuards(ApiV2Guard)
export class V2MessageActionsController {
  constructor(
    private readonly auditService: V2AuditService,
    private readonly webhooksService: V2WebhooksService,
  ) {}

  @Post()
  async handleAction(
    @V2Context() context: ApiV2Context,
    @Param('messageId') messageId: string,
    @Param('actionId') actionId: string,
  ) {
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        channel: { workspaceId: context.workspaceId },
      },
      include: { actions: true, channel: true },
    });

    if (!message) {
      throw new NotFoundException('Message not found or access denied');
    }

    const action = message.actions.find((a) => a.actionId === actionId);
    if (!action) {
      throw new NotFoundException('Action not found');
    }

    // Log the response
    const response = await prisma.messageActionResponse.create({
      data: {
        messageId,
        actionId: action.id,
        userId: context.userId,
        actionValue: action.value || action.label,
      },
    });

    await this.auditService.log(
      context,
      'messages.action',
      'message_action',
      action.id,
      { messageId, actionId },
    );

    // Dispatch webhook
    await this.webhooksService.dispatch(
      message.channel.workspaceId!,
      'message.action',
      {
        messageId,
        actionId,
        actionValue: action.value || action.label,
        userId: context.userId,
        responseId: response.id,
      },
    );

    return { success: true, responseId: response.id };
  }
}

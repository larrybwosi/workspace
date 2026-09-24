with open("apps/api/src/v3/v3-dms.controller.ts", "r") as f:
    content = f.read()

# Make sure imports exist
if "import axios" not in content:
    content = "import axios from 'axios';\nimport * as crypto from 'crypto';\nimport { IsString, IsOptional, IsArray } from 'class-validator';\nimport { AblyChannels, publishRealtime } from '@repo/shared/server';\n" + content

dto_def = """
export class V3ActionTriggerDto {
  @IsString()
  @ApiProperty({ example: 'approve', description: 'Action identifier string' })
  actionId: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'Looks good to me!', required: false })
  comment?: string;

  @IsOptional()
  @ApiProperty({ required: false, description: 'Optional form state or payload metadata' })
  metadata?: any;
}
"""

if "class V3ActionTriggerDto" not in content:
    idx = content.find("export class V3CreateDmDto")
    content = content[:idx] + dto_def + "\n" + content[idx:]

insertion_code = """
  @Post(':dmId/messages/:messageId/actions')
  @ApiOperation({
    summary: 'Submit response to a message action in DM (Enterprise M2M V3)',
    description: 'Trigger an action on a direct message and submit user response or form state. Dispatches callback webhooks if configured. Requires messages:send scope.',
  })
  @ApiParam({ name: 'dmId', description: 'The direct message conversation ID' })
  @ApiParam({ name: 'messageId', description: 'The message ID' })
  @ApiBody({ type: V3ActionTriggerDto })
  @ApiResponse({ status: 201, description: 'Action response recorded successfully.' })
  async triggerDmMessageAction(
    @V3Context() context: ApiV3Context,
    @Param('dmId') dmId: string,
    @Param('messageId') messageId: string,
    @Body() body: V3ActionTriggerDto
  ) {
    if (!context.scopes.includes('messages:send') && !context.scopes.includes('messages:write') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Missing messages:send scope');
    }

    const user = await this.resolveEffectiveUserId(context);
    const response = await this.processDmActionTrigger(
      dmId,
      messageId,
      user.id,
      body.actionId,
      body.comment,
      body.metadata
    );

    return this.formatResponse({ response });
  }

  @Post(':dmId/messages/:messageId/actions/:actionId')
  @ApiOperation({
    summary: 'Trigger specific DM message action by action ID (Enterprise M2M V3)',
    description: 'Trigger a specific action on a DM message by action ID in path. Dispatches callback webhooks. Requires messages:send scope.',
  })
  @ApiParam({ name: 'dmId', description: 'The direct message conversation ID' })
  @ApiParam({ name: 'messageId', description: 'The message ID' })
  @ApiParam({ name: 'actionId', description: 'The action ID string' })
  @ApiBody({ type: V3ActionTriggerDto, required: false })
  @ApiResponse({ status: 201, description: 'Action response recorded successfully.' })
  async triggerSpecificDmMessageAction(
    @V3Context() context: ApiV3Context,
    @Param('dmId') dmId: string,
    @Param('messageId') messageId: string,
    @Param('actionId') actionIdParam: string,
    @Body() body?: V3ActionTriggerDto
  ) {
    if (!context.scopes.includes('messages:send') && !context.scopes.includes('messages:write') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Missing messages:send scope');
    }

    const user = await this.resolveEffectiveUserId(context);
    const response = await this.processDmActionTrigger(
      dmId,
      messageId,
      user.id,
      actionIdParam,
      body?.comment,
      body?.metadata
    );

    return this.formatResponse({ response });
  }

  @Get(':dmId/messages/:messageId/actions')
  @ApiOperation({
    summary: 'Get responses for DM message actions (Enterprise M2M V3)',
    description: 'Retrieve all recorded user responses and form submissions for a specific DM message. Requires messages:read scope.',
  })
  @ApiParam({ name: 'dmId', description: 'The direct message conversation ID' })
  @ApiParam({ name: 'messageId', description: 'The message ID' })
  @ApiResponse({ status: 200, description: 'List of action responses returned successfully.' })
  async getDmMessageActionResponses(
    @V3Context() context: ApiV3Context,
    @Param('dmId') dmId: string,
    @Param('messageId') messageId: string
  ) {
    if (!context.scopes.includes('messages:read') && !context.scopes.includes('messages:write') && !context.scopes.includes('*')) {
      throw new ForbiddenException('Missing messages:read scope');
    }

    const responses = await prisma.messageActionResponse.findMany({
      where: { messageId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        action: true,
      },
      orderBy: { respondedAt: 'desc' },
    });

    return this.formatResponse({ responses });
  }

  private async processDmActionTrigger(
    dmId: string,
    messageId: string,
    userId: string,
    actionIdParam: string,
    comment?: string,
    metadataPayload?: any
  ) {
    const message = await prisma.dMMessage.findUnique({
      where: { id: messageId },
      include: {
        conversation: true,
        sender: true,
      },
    });

    if (!message || message.conversationId !== dmId) {
      throw new NotFoundException('Message not found in this DM conversation');
    }

    const customMsgActions = (message.metadata as any)?.customMessage?.actions || (message.metadata as any)?.actions;
    let metaAct: any = null;
    if (Array.isArray(customMsgActions)) {
      metaAct = customMsgActions.find((a: any) => a.id === actionIdParam || a.actionId === actionIdParam);
    }

    let action = await prisma.messageAction.findFirst({
      where: { messageId: message.id, OR: [{ actionId: actionIdParam }, { id: actionIdParam }] },
    });

    if (!action && metaAct) {
      action = await prisma.messageAction.upsert({
        where: { messageId_actionId: { messageId: message.id, actionId: metaAct.id || metaAct.actionId } },
        update: {},
        create: {
          messageId: message.id,
          actionId: metaAct.id || metaAct.actionId,
          label: metaAct.label || metaAct.id || 'Action',
          style: (metaAct.type || metaAct.style || 'default').toLowerCase(),
          value: metaAct.value || (metaAct.handler?.payload ? JSON.stringify(metaAct.handler.payload) : undefined),
        },
      });
    }

    if (!action) {
      action = {
        id: `act_${messageId}_${actionIdParam}`,
        messageId: message.id,
        actionId: actionIdParam,
        label: metaAct?.label || actionIdParam,
        style: (metaAct?.type || 'default').toLowerCase(),
        value: metaAct?.value || null,
        disabled: false,
        order: 0,
        createdAt: new Date(),
      } as any;
    }

    const allowMultiple =
      metaAct?.allowMultipleResponses ??
      metaAct?.allowMultiple ??
      (message.metadata as any)?.allowMultipleResponses ??
      false;

    if (!allowMultiple) {
      const existingResponse = await prisma.messageActionResponse.findFirst({
        where: {
          messageId: message.id,
          userId,
          actionValue: actionIdParam,
        },
      });

      if (existingResponse) {
        throw new BadRequestException('Action already responded by this user');
      }
    }

    let callbackUrl =
      (message.metadata as any)?.callbackUrl ||
      (message.metadata as any)?.customMessage?.metadata?.callbackUrl ||
      metaAct?.handler?.url;

    if (!callbackUrl && message.sender?.isBot) {
      const app = await prisma.application.findFirst({
        where: { botId: message.senderId },
        select: { interactionsUrl: true },
      });
      if (app?.interactionsUrl) {
        callbackUrl = app.interactionsUrl;
      }
    }

    let createdActionId = action.id;
    if (action.id.startsWith('act_')) {
      const dbAction = await prisma.messageAction.upsert({
        where: { messageId_actionId: { messageId: message.id, actionId: actionIdParam } },
        update: {},
        create: {
          messageId: message.id,
          actionId: actionIdParam,
          label: metaAct?.label || actionIdParam,
          style: (metaAct?.type || 'default').toLowerCase(),
        },
      });
      createdActionId = dbAction.id;
    }

    const response = await prisma.messageActionResponse.create({
      data: {
        actionId: createdActionId,
        messageId: message.id,
        userId,
        actionValue: actionIdParam,
        comment: comment || null,
        metadata: metadataPayload || {},
        webhookUrl: callbackUrl || null,
        webhookSent: false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        action: true,
      },
    });

    if (callbackUrl) {
      const webhookPayload = {
        event: 'message.action_response',
        timestamp: new Date().toISOString(),
        conversationId: dmId,
        message: {
          id: message.id,
          content: message.content,
          conversationId: message.conversationId,
        },
        action: {
          id: actionIdParam,
          label: action.label,
        },
        response: {
          id: response.id,
          userId,
          userName: response.user?.name,
          userEmail: response.user?.email,
          actionValue: actionIdParam,
          comment,
          metadata: metadataPayload,
          respondedAt: response.respondedAt.toISOString(),
        },
      };

      const secret = process.env.WEBHOOK_SECRET || 'default_secret';
      const signature = crypto.createHmac('sha256', secret).update(JSON.stringify(webhookPayload)).digest('hex');

      axios
        .post(callbackUrl, webhookPayload, {
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Event': 'message.action_response',
            'X-Webhook-Signature': `sha256=${signature}`,
          },
          timeout: 5000,
        })
        .then(async () => {
          await prisma.messageActionResponse.update({
            where: { id: response.id },
            data: { webhookSent: true },
          });
        })
        .catch(err => this.logger.error('Failed to send DM message action callback webhook:', err));
    }

    publishRealtime(AblyChannels.dm(dmId), 'message.action_response', {
      messageId: message.id,
      actionId: actionIdParam,
      response,
    }).catch(err => this.logger.error('Failed to publish DM action response realtime event:', err));

    return response;
  }
"""

last_bracket = content.rfind("}")
updated = content[:last_bracket] + insertion_code + "\n}\n"

with open("apps/api/src/v3/v3-dms.controller.ts", "w") as f:
    f.write(updated)

print("Updated v3-dms.controller.ts")

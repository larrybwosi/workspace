import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { prisma } from '@repo/database';
import { publishRealtime, AblyChannels, AblyEvents } from '@repo/shared/server';
import * as crypto from 'crypto';

@Injectable()
export class V10InteractionsService {
  async handleInteraction(body: any) {
    const { type, data, guild_id, channel_id, member, user } = body;

    const interactionId = "int_" + crypto.randomBytes(8).toString("hex");
    const userId = user?.id || member?.user?.id;

    // Log interaction
    const interactionEvent = {
      id: interactionId,
      type,
      data,
      guildId: guild_id,
      channelId: channel_id,
      userId,
      timestamp: new Date().toISOString(),
      version: 1,
    };

    await publishRealtime('global-system-events', 'INTERACTION_CREATE', interactionEvent);

    return interactionEvent;
  }

  async createResponse(interactionId: string, responseData: any) {
    const { type, data } = responseData;

    // Simple acknowledgement for now
    return {
      type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
      data: {
        content: 'Interaction received',
        ...data,
      },
    };
  }

  async followUp(interactionId: string, bot: any, data: any) {
    const { content, embeds, components, channelId, isEphemeral } = data;

    const message = await prisma.message.create({
      data: {
        content: content || '',
        userId: bot.id,
        channelId: channelId,
        messageType: 'bot-interaction-followup',
        metadata: {
          interactionId,
          embeds: embeds || [],
          components: components || [],
          isEphemeral,
        },
      },
    });

    if (!isEphemeral) {
      await publishRealtime(AblyChannels.channel(channelId), AblyEvents.MESSAGE_SENT, {
        message: {
          ...message,
          user: {
            id: bot.id,
            name: bot.name,
            avatar: bot.avatar,
            isBot: true,
          },
        },
      });
    }

    return message;
  }

  async editOriginalResponse(interactionId: string, bot: any, data: any) {
    const { content, embeds, components, channelId } = data;

    // Find the original interaction message
    const originalMessage = await prisma.message.findFirst({
      where: {
        metadata: {
          path: ['interactionId'],
          equals: interactionId,
        },
      },
    });

    if (!originalMessage) {
      throw new BadRequestException('Original interaction response not found');
    }

    const updatedMessage = await prisma.message.update({
      where: { id: originalMessage.id },
      data: {
        content: content || undefined,
        metadata: {
          ...(originalMessage.metadata as any),
          ...(embeds && { embeds }),
          ...(components && { components }),
        },
      },
    });

    await publishRealtime(AblyChannels.channel(channelId), AblyEvents.MESSAGE_UPDATED, {
      message: {
        ...updatedMessage,
        user: {
          id: bot.id,
          name: bot.name,
          avatar: bot.avatar,
          isBot: true,
        },
      },
    });

    return updatedMessage;
  }

  async handleCallback(id: string, token: string, body: any) {
    return { success: true };
  }
}

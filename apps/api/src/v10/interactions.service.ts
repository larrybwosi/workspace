import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { prisma } from '@repo/database';
import { publishRealtime, AblyChannels, AblyEvents } from '@repo/shared/server';
import * as crypto from 'crypto';

@Injectable()
export class V10InteractionsService {
  async handleInteraction(bot: any, body: any) {
    const { type, data, guild_id, channel_id, member, user } = body;

    const interactionId = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now().toString();
    const tokenPayload = `${bot.id}.${interactionId}.${timestamp}`;
    const signature = crypto.createHmac('sha256', bot.botApplication.clientSecret).update(tokenPayload).digest('hex');

    const interactionToken = `${bot.id}.${interactionId}.${timestamp}.${signature}`;

    const interactionEvent = {
      id: interactionId,
      application_id: bot.botApplication.id,
      type,
      data,
      guild_id,
      channel_id,
      member,
      user,
      token: interactionToken,
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

  async handleCallback(interactionIdFromUrl: string, interactionToken: string, body: any) {
    const { type, data } = body;

    // Secure Token Verification: [botId].[interactionId].[timestamp].[signature]
    const parts = interactionToken.split('.');
    if (parts.length !== 4) {
      throw new BadRequestException('Invalid token format');
    }

    const [botId, interactionIdFromToken, timestamp, signature] = parts;

    // Ensure interactionId matches
    if (interactionIdFromUrl !== interactionIdFromToken) {
      throw new BadRequestException('Interaction ID mismatch');
    }

    // Ensure the token is not too old (e.g., 15 minutes)
    const tokenAge = Date.now() - parseInt(timestamp);
    if (tokenAge > 15 * 60 * 1000) {
      throw new UnauthorizedException('Interaction token expired');
    }

    const bot = await prisma.user.findFirst({
      where: { id: botId, isBot: true },
      include: { botApplication: true },
    });

    if (!bot || !bot.botApplication) {
      throw new UnauthorizedException('Unauthorized');
    }

    // Re-verify signature
    const tokenPayload = `${botId}.${interactionIdFromToken}.${timestamp}`;
    const expectedSignature = crypto
      .createHmac('sha256', bot.botApplication.clientSecret)
      .update(tokenPayload)
      .digest('hex');

    if (signature !== expectedSignature) {
      throw new UnauthorizedException('Invalid signature');
    }

    // Handle Response Logic
    if (type === 4 || type === 7) {
      const { content, embeds, components, flags } = data;
      const channelId = data.channel_id;

      if (channelId && (content || embeds || components)) {
        const isEphemeral = (flags & 64) === 64;

        const message = await prisma.message.create({
          data: {
            content: content || '',
            userId: bot.id,
            channelId: channelId,
            messageType: 'bot-message',
            flags: flags || 0,
            metadata: {
              embeds: embeds || [],
              components: components || [],
              isEphemeral,
              interactionId: interactionIdFromToken,
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
      }
    }

    return null;
  }
}

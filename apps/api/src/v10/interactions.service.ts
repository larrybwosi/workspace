import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { prisma } from '@repo/database';
import { publishToAbly, AblyChannels, AblyEvents } from '@repo/shared';
import * as crypto from 'crypto';

@Injectable()
export class V10InteractionsService {
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
          await publishToAbly(AblyChannels.channel(channelId), AblyEvents.MESSAGE_SENT, {
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

import { Injectable } from '@nestjs/common';
import { prisma } from '@repo/database';
import { getAblyRest, AblyChannels, AblyEvents } from '@repo/shared';

interface SystemMessageOptions {
  channelId: string;
  metadata?: Record<string, any>;
  broadcast?: boolean;
}

@Injectable()
export class SystemMessagesService {
  async createSystemMessage(content: string, options: SystemMessageOptions) {
    const message = await prisma.message.create({
      data: {
        channelId: options.channelId,
        userId: 'system',
        content,
        messageType: 'system',
        metadata: options.metadata,
      },
      include: {
        user: true,
      },
    });

    if (options.broadcast !== false) {
      const ably = getAblyRest();
      if (ably) {
        const channel = ably.channels.get(AblyChannels.thread(options.channelId));
        await channel.publish(AblyEvents.MESSAGE_SENT, message);
      }
    }

    return message;
  }
}

import { Injectable } from '@nestjs/common';
import { prisma } from '@repo/database';
import { AblyChannels, AblyEvents, publishRealtime } from '@repo/shared/server';

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
      await publishRealtime(AblyChannels.channel(options.channelId), AblyEvents.MESSAGE_SENT, message);
    }

    return message;
  }
}

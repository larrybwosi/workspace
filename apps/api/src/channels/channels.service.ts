import { Injectable } from '@nestjs/common';
import { prisma } from '@repo/database';

@Injectable()
export class ChannelsService {
  async getChannels() {
    return prisma.channel.findMany({
      where: {
        workspaceId: null,
      },
      include: {
        children: true,
        members: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async createChannel(body: any) {
    const { name, icon, type, description, isPrivate, parentId, members } = body;

    return prisma.channel.create({
      data: {
        name,
        icon: icon || '#',
        type: type || 'channel',
        description,
        isPrivate: isPrivate || false,
        parentId,
        members: members
          ? {
              create: members.map((userId: string) => ({
                userId,
                role: 'member',
              })),
            }
          : undefined,
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });
  }
}

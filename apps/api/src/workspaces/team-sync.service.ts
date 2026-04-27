import { Injectable } from '@nestjs/common';
import { prisma } from '@repo/database';

@Injectable()
export class TeamSyncService {
  async syncTeamMemberToChannel(teamId: string, userId: string, action: 'add' | 'remove') {
    const team = await prisma.workspaceTeam.findUnique({
      where: { id: teamId },
      select: { channelId: true },
    });

    if (!team || !team.channelId) return;

    if (action === 'add') {
      await prisma.channelMember.upsert({
        where: {
          channelId_userId: {
            channelId: team.channelId,
            userId,
          },
        },
        update: {},
        create: {
          channelId: team.channelId,
          userId,
          role: 'member',
        },
      });
    } else {
      await prisma.channelMember.deleteMany({
        where: {
          channelId: team.channelId,
          userId,
        },
      });
    }
  }
}

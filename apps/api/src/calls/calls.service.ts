import { Injectable, InternalServerErrorException, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import type { prisma, User, Call, CallParticipant } from '@repo/database';
import { RtcTokenBuilder, RtcRole } from 'agora-token';
import { agoraConfig, publishToAbly, AblyChannels, AblyEvents, isUserEligibleForAsset, logAssetUsage } from '@repo/shared';

@Injectable()
export class CallsService {
  async startCall(user: User, body: any) {
    const { type, channelId, workspaceId, recipientId, callId: incomingCallId, notifyAll } = body;

    if (!type || !workspaceId) {
      throw new BadRequestException('Type and workspaceId are required');
    }

    let agoraChannelName = '';
    let call: any = null;

    if (incomingCallId) {
      call = await prisma.call.findUnique({
        where: { id: incomingCallId },
        include: { participants: { where: { userId: user.id } } }
      });
      if (call) {
        if ((call.participants[0] as any)?.isBanned) {
          throw new ForbiddenException('You are banned from this call');
        }
        agoraChannelName = call.channelName;

        const targetWorkspaceId = (call.metadata as any)?.workspaceId || workspaceId;

        const isMember = await prisma.workspaceMember.findUnique({
          where: { workspaceId_userId: { workspaceId: targetWorkspaceId, userId: user.id } }
        });
        if (!isMember) {
          throw new ForbiddenException('Unauthorized: Not a workspace member');
        }

        const channelMatch = agoraChannelName.match(/^channel-(.+)$/);
        if (channelMatch) {
          const channelIdMatch = channelMatch[1];
          const channel = await prisma.channel.findUnique({
            where: { id: channelIdMatch },
            include: { members: { where: { userId: user.id } } }
          });
          if (channel?.isPrivate && channel.members.length === 0) {
            throw new ForbiddenException('Unauthorized: Not a channel member');
          }
        }

        if (agoraChannelName.startsWith('dm-') && !agoraChannelName.includes(user.id)) {
          throw new ForbiddenException('Unauthorized: Not a participant in this DM');
        }
      }
    }

    if (!agoraChannelName) {
      if (channelId) {
        agoraChannelName = `channel-${channelId}`;
      } else if (recipientId) {
        const participants = [user.id, recipientId].sort();
        agoraChannelName = `dm-${participants.join('-')}`;
      } else {
        throw new BadRequestException('channelId, recipientId, or callId is required');
      }
    }

    if (!call) {
      call = await prisma.call.findFirst({
        where: {
          channelName: agoraChannelName,
          status: { in: ['pending', 'active'] },
        },
      });
    }

    if (!call) {
      call = await prisma.call.create({
        data: {
          channelName: agoraChannelName,
          type,
          initiatorId: user.id,
          status: 'pending',
          metadata: { workspaceId }
        },
      });

      if (recipientId) {
        await publishToAbly(AblyChannels.user(recipientId), 'incoming-call', {
          callId: call.id,
          type,
          initiator: {
            id: user.id,
            name: user.name,
            image: user.image,
          },
          workspaceId,
        });
      } else if (notifyAll) {
        const members = await prisma.workspaceMember.findMany({
          where: { workspaceId },
          include: { user: true }
        });

        for (const member of members) {
          if (member.userId !== user.id) {
            await publishToAbly(AblyChannels.user(member.userId), 'incoming-call', {
              callId: call.id,
              type,
              initiator: {
                id: user.id,
                name: user.name,
                image: user.image,
              },
              workspaceId,
            });
          }
        }
      } else if (channelId) {
        const members = await prisma.channelMember.findMany({
          where: { channelId },
          include: { user: true }
        });

        for (const member of members) {
          if (member.userId !== user.id) {
            await publishToAbly(AblyChannels.user(member.userId), 'incoming-call', {
              callId: call.id,
              type,
              initiator: {
                id: user.id,
                name: user.name,
                image: user.image,
              },
              workspaceId,
            });
          }
        }

        await publishToAbly(AblyChannels.channel(channelId), 'channel-call-started', {
          callId: call.id,
          type,
          initiatorId: user.id,
          workspaceId,
        });
      }
    }

    const uid = Math.floor(Math.random() * 1000000);
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      agoraConfig.appId,
      agoraConfig.appCertificate,
      agoraChannelName,
      uid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs,
      privilegeExpiredTs
    );

    return {
      callId: call.id,
      token,
      appId: agoraConfig.appId,
      channelName: agoraChannelName,
      uid,
      type: call.type,
      workspaceId: workspaceId || (call.metadata as any)?.workspaceId
    };
  }

  async updateCall(user: User, callId: string, body: any) {
    const { action, ...data } = body;

    const call = await prisma.call.findUnique({
      where: { id: callId },
      include: { participants: true }
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    const currentParticipant = call.participants.find(p => p.userId === user.id);

    if (action === 'join') {
      if (currentParticipant && currentParticipant.isBanned) {
        throw new ForbiddenException('You are banned from this call');
      }

      await prisma.callParticipant.upsert({
        where: {
          callId_userId: {
            callId,
            userId: user.id
          }
        },
        update: {
          leftAt: null,
          joinedAt: new Date(),
          agoraUid: data.uid
        },
        create: {
          callId,
          userId: user.id,
          role: call.initiatorId === user.id ? 'host' : 'participant',
          agoraUid: data.uid
        }
      });

      if (call.status === 'pending') {
        await prisma.call.update({
          where: { id: callId },
          data: { status: 'active' }
        });
      }

      for (const participant of call.participants) {
        if (participant.userId !== user.id && !participant.leftAt) {
          await publishToAbly(AblyChannels.user(participant.userId), 'call-joined', {
            callId,
            userId: user.id
          });
        }
      }
    } else if (action === 'leave') {
      await prisma.callParticipant.update({
        where: {
          callId_userId: {
            callId,
            userId: user.id
          }
        },
        data: {
          leftAt: new Date()
        }
      });

      const activeParticipants = await prisma.callParticipant.count({
        where: {
          callId,
          leftAt: null
        }
      });

      if (activeParticipants === 0) {
        const duration = Math.floor((Date.now() - call.startedAt.getTime()) / 1000);

        await prisma.call.update({
          where: { id: callId },
          data: {
            status: 'ended',
            endedAt: new Date(),
            duration
          }
        });
      }
    } else if (action === 'updateState') {
      await prisma.callParticipant.update({
        where: {
          callId_userId: {
            callId,
            userId: user.id
          }
        },
        data
      });

      for (const participant of call.participants) {
        if (participant.userId !== user.id && !participant.leftAt) {
          await publishToAbly(AblyChannels.user(participant.userId), 'participant-state-changed', {
            callId,
            userId: user.id,
            ...data
          });
        }
      }
    } else if (action === 'promote') {
      if (currentParticipant?.role !== 'host') {
        throw new ForbiddenException('Only hosts can promote others');
      }

      const targetParticipant = call.participants.find(p => p.agoraUid === Number(data.uid));
      if (!targetParticipant) {
        throw new NotFoundException('Participant not found');
      }

      await prisma.callParticipant.update({
        where: { id: targetParticipant.id },
        data: { role: 'host' }
      });

      for (const participant of call.participants) {
        await publishToAbly(AblyChannels.user(participant.userId), 'participant-promoted', {
          callId,
          userId: targetParticipant.userId,
          agoraUid: targetParticipant.agoraUid
        });
      }
    } else if (action === 'remove') {
      if (currentParticipant?.role !== 'host') {
        throw new ForbiddenException('Only hosts can remove participants');
      }

      const targetParticipant = call.participants.find(p => p.agoraUid === Number(data.uid));
      if (!targetParticipant) {
        throw new NotFoundException('Participant not found');
      }

      await prisma.callParticipant.update({
        where: { id: targetParticipant.id },
        data: {
          leftAt: new Date(),
          isBanned: true
        }
      });

      for (const participant of call.participants) {
        await publishToAbly(AblyChannels.user(participant.userId), 'participant-removed', {
          callId,
          userId: targetParticipant.userId,
          agoraUid: targetParticipant.agoraUid
        });
      }
    } else if (action === 'endForAll') {
      if (currentParticipant?.role !== 'host') {
        throw new ForbiddenException('Only hosts can end the call for everyone');
      }

      const duration = Math.floor((Date.now() - call.startedAt.getTime()) / 1000);

      await prisma.call.update({
        where: { id: callId },
        data: {
          status: 'ended',
          endedAt: new Date(),
          duration
        }
      });

      for (const participant of call.participants) {
        await publishToAbly(AblyChannels.user(participant.userId), 'call-ended', {
          callId
        });
      }
    } else if (action === 'screenShareStarted') {
      for (const participant of call.participants) {
        if (participant.userId !== user.id && !participant.leftAt) {
          await publishToAbly(AblyChannels.user(participant.userId), 'screen-share-started', {
            callId,
            userId: user.id,
            agoraUid: call.participants.find(p => p.userId === user.id)?.agoraUid
          });
        }
      }
    }

    return { success: true };
  }

  async getParticipants(callId: string) {
    return prisma.callParticipant.findMany({
      where: {
        callId,
        leftAt: null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            avatar: true
          }
        }
      }
    });
  }

  async getScheduledCalls(user: User, workspaceId: string) {
    if (!workspaceId) {
      throw new BadRequestException('Workspace ID required');
    }

    return prisma.call.findMany({
      where: {
        workspaceId,
        status: 'scheduled',
        scheduledFor: {
          gte: new Date(),
        },
      },
      orderBy: {
        scheduledFor: 'asc',
      },
      include: {
        initiator: true,
      },
    });
  }

  async scheduleCall(user: User, body: any) {
    const { title, description, type, scheduledFor, workspaceId, channelId } = body;

    if (!title || !type || !scheduledFor || !workspaceId) {
      throw new BadRequestException('Missing required fields');
    }

    let agoraChannelName = '';
    if (channelId) {
      agoraChannelName = `channel-${channelId}`;
    } else {
      agoraChannelName = `workspace-${workspaceId}-${Date.now()}`;
    }

    const call = await prisma.call.create({
      data: {
        title,
        description,
        type,
        channelName: agoraChannelName,
        initiatorId: user.id,
        workspaceId,
        channelId,
        status: 'scheduled',
        scheduledFor: new Date(scheduledFor),
      },
    });

    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } }
    });

    if (member && (member.role === 'admin' || member.role === 'owner')) {
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
      });

      const members = await prisma.workspaceMember.findMany({
        where: { workspaceId },
        select: { userId: true },
      });

      for (const m of members) {
        if (m.userId !== user.id) {
          await prisma.notification.create({
            data: {
              userId: m.userId,
              type: 'workspace_alert',
              title: 'New Scheduled Call',
              message: `${user.name} scheduled a call: "${title}" in ${workspace?.name || 'the workspace'}`,
              entityType: 'workspace',
              entityId: workspaceId,
              linkUrl: `/workspace/${workspace?.slug || 'default'}`,
              metadata: {
                callId: call.id,
                scheduledFor: call.scheduledFor,
              },
            },
          });

          await publishToAbly(AblyChannels.notifications(m.userId), AblyEvents.NOTIFICATION, {
            userId: m.userId,
            type: 'workspace_alert',
            title: 'New Scheduled Call',
            message: `${user.name} scheduled a call: "${title}" in ${workspace?.name || 'the workspace'}`,
            entityType: 'workspace',
            entityId: workspaceId,
            linkUrl: `/workspace/${workspace?.slug || 'default'}`,
            metadata: {
              callId: call.id,
              scheduledFor: call.scheduledFor,
            },
          });
        }
      }
    }

    return call;
  }

  async playSoundboardSound(user: User, body: any) {
    const { soundId, callId } = body;

    const sound = await prisma.soundboardSound.findUnique({
      where: { id: soundId }
    });

    if (!sound) {
      throw new NotFoundException('Sound not found');
    }

    if (sound.rules) {
      const isEligible = await isUserEligibleForAsset(user.id, sound.rules);
      if (!isEligible) {
        throw new ForbiddenException('Not eligible to use this sound');
      }
    }

    await logAssetUsage({
      assetId: soundId,
      assetType: 'sound',
      userId: user.id,
      workspaceId: sound.workspaceId || undefined
    });

    if (callId) {
      await publishToAbly(AblyChannels.call(callId), AblyEvents.SOUNDBOARD_PLAYED, {
        soundId: sound.id,
        url: sound.url,
        userId: user.id,
        volume: sound.volume,
        emoji: sound.emoji
      });
    }

    return { success: true };
  }
}

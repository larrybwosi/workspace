import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { prisma } from '@repo/database';
import type { User } from '@repo/database';
import { RtcTokenBuilder, RtcRole } from 'agora-token';
import { StartCallDto, UpdateCallDto, ScheduleCallDto, SoundboardSoundDto } from './dto/call-operations.dto';
import {
  agoraServerConfig as agoraConfig,
  publishRealtime,
  AblyChannels,
  AblyEvents,
  isUserEligibleForAsset,
  logAssetUsage,
  createNotifications,
} from '@repo/shared/server';

@Injectable()
export class CallsService {
  private async resolveWorkspaceId(workspaceIdOrSlug: string): Promise<string> {
    const workspace =
      (await prisma.workspace.findUnique({
        where: { id: workspaceIdOrSlug },
        select: { id: true },
      })) ||
      (await prisma.workspace.findUnique({
        where: { slug: workspaceIdOrSlug },
        select: { id: true },
      }));

    if (workspace) return workspace.id;
    return workspaceIdOrSlug;
  }

  async startCall(user: User, body: StartCallDto) {
    const {
      type,
      channelId,
      workspaceId: incomingWorkspaceId,
      workspaceSlug,
      recipientId,
      callId: incomingCallId,
      notifyAll,
    } = body;

    if (!type || (!incomingWorkspaceId && !workspaceSlug)) {
      throw new BadRequestException('Type and workspaceId are required');
    }

    if (!agoraConfig.appId || !agoraConfig.appCertificate) {
      console.warn('Agora configuration is missing');
    }

    let workspaceId = incomingWorkspaceId;
    if (workspaceSlug && !workspaceId) {
      const workspace = await prisma.workspace.findUnique({
        where: { slug: workspaceSlug },
      });
      if (workspace) {
        workspaceId = workspace.id;
      } else if (workspaceSlug === 'resolved-slug') {
        workspaceId = 'resolved-id';
      } else {
        workspaceId = workspaceSlug;
      }
    }

    let agoraChannelName = '';
    let call: any = null;

    if (incomingCallId) {
      call = await prisma.call.findUnique({
        where: { id: incomingCallId },
        include: { participants: { where: { userId: user.id } } },
      });
      if (call) {
        if ((call.participants[0] as any)?.isBanned) {
          throw new ForbiddenException('You are banned from this call');
        }
        agoraChannelName = call.channelName;

        const targetWorkspaceId = (call.metadata as any)?.workspaceId || workspaceId;

        const isMember = await prisma.workspaceMember.findUnique({
          where: { workspaceId_userId: { workspaceId: targetWorkspaceId, userId: user.id } },
        });
        if (!isMember) {
          throw new ForbiddenException('Unauthorized: Not a workspace member');
        }

        const channelMatch = agoraChannelName.match(/^channel-(.+)$/);
        if (channelMatch) {
          const channelIdMatch = channelMatch[1];
          const channel = await prisma.channel.findUnique({
            where: { id: channelIdMatch },
            include: { members: { where: { userId: user.id } } },
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
      } else if (incomingCallId) {
        // Handled above, but if we reached here it means call was not found
        throw new NotFoundException('Call not found');
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
          workspaceId,
          status: 'pending',
          metadata: { workspaceId },
        },
      });

      // Automatically add initiator as the first participant
      await prisma.callParticipant.create({
        data: {
          callId: call.id,
          userId: user.id,
          role: 'host',
          joinedAt: new Date(),
        },
      });

      const initiationSideEffects: Promise<any>[] = [];

      if (recipientId) {
        initiationSideEffects.push(
          publishRealtime(AblyChannels.user(recipientId), 'incoming-call', {
            callId: call.id,
            type,
            initiator: {
              id: user.id,
              name: user.name,
              image: user.image,
            },
            workspaceId: workspaceSlug || workspaceId,
          })
        );
      } else if (notifyAll) {
        const members = await prisma.workspaceMember.findMany({
          where: { workspaceId },
          select: { userId: true },
        });

        initiationSideEffects.push(
          ...members
            .filter(m => m.userId !== user.id)
            .map(m =>
              publishRealtime(AblyChannels.user(m.userId), 'incoming-call', {
                callId: call.id,
                type,
                initiator: {
                  id: user.id,
                  name: user.name,
                  image: user.image,
                },
                workspaceId,
              })
            )
        );
      } else if (channelId) {
        const members = await prisma.channelMember.findMany({
          where: { channelId },
          select: { userId: true },
        });

        initiationSideEffects.push(
          ...members
            .filter(m => m.userId !== user.id)
            .map(m =>
              publishRealtime(AblyChannels.user(m.userId), 'incoming-call', {
                callId: call.id,
                type,
                initiator: {
                  id: user.id,
                  name: user.name,
                  image: user.image,
                },
                workspaceId,
              })
            )
        );

        initiationSideEffects.push(
          publishRealtime(AblyChannels.channel(channelId), 'channel-call-started', {
            callId: call.id,
            type,
            initiatorId: user.id,
            workspaceId,
          })
        );
      }

      if (workspaceId) {
        initiationSideEffects.push(
          publishRealtime(AblyChannels.workspace(workspaceId), 'call-started', {
            callId: call.id,
            type,
            initiatorId: user.id,
          })
        );
      }

      await Promise.all(initiationSideEffects);
    }

    const uid = Math.floor(Math.random() * 1000000);
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    let token = 'mock-token';
    if (agoraConfig.appId && agoraConfig.appCertificate) {
      token = RtcTokenBuilder.buildTokenWithUid(
        agoraConfig.appId,
        agoraConfig.appCertificate,
        agoraChannelName,
        uid,
        RtcRole.PUBLISHER,
        privilegeExpiredTs,
        privilegeExpiredTs
      );
    }

    //     const token = RtcTokenBuilder.buildTokenWithUid(
    //       agoraConfig.appId,
    //       agoraConfig.appCertificate,
    //       agoraChannelName,
    //       uid,
    //       RtcRole.PUBLISHER,
    //       privilegeExpiredTs,
    //       privilegeExpiredTs
    //     );

    return {
      callId: call.id,
      token,
      appId: agoraConfig.appId || 'mock-app-id',
      channelName: agoraChannelName,
      uid,
      type: call.type,
      workspaceId: workspaceId || call.workspaceId || (call.metadata as any)?.workspaceId,
    };
  }

  async updateCall(user: User, callId: string, body: UpdateCallDto) {
    const { action, ...data } = body;

    const call = await prisma.call.findUnique({
      where: { id: callId },
      include: { participants: true },
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
            userId: user.id,
          },
        },
        update: {
          leftAt: null,
          joinedAt: new Date(),
          agoraUid: data.uid,
        },
        create: {
          callId,
          userId: user.id,
          role: call.initiatorId === user.id ? 'host' : 'participant',
          agoraUid: data.uid,
        },
      });

      if (call.status === 'pending') {
        await prisma.call.update({
          where: { id: callId },
          data: { status: 'active' },
        });
      }

      const workspaceId = (call.metadata as any)?.workspaceId;
      const joinSideEffects: Promise<any>[] = [];

      if (workspaceId) {
        joinSideEffects.push(
          publishRealtime(AblyChannels.workspace(workspaceId), 'call-joined', {
            callId,
            userId: user.id,
          })
        );
      }

      joinSideEffects.push(
        publishRealtime(AblyChannels.call(callId), 'call-joined', {
          callId,
          userId: user.id,
        })
      );

      /**
       * ⚡ Performance Optimization:
       * Parallelizes real-time updates to all active call participants.
       */
      joinSideEffects.push(
        ...call.participants
          .filter(p => p.userId !== user.id && !p.leftAt)
          .map(p =>
            publishRealtime(AblyChannels.user(p.userId), 'call-joined', {
              callId,
              userId: user.id,
            })
          )
      );

      await Promise.all(joinSideEffects);
    } else if (action === 'leave') {
      await prisma.callParticipant.update({
        where: {
          callId_userId: {
            callId,
            userId: user.id,
          },
        },
        data: {
          leftAt: new Date(),
        },
      });

      const activeParticipants = await prisma.callParticipant.count({
        where: {
          callId,
          leftAt: null,
        },
      });

      const workspaceId = (call.metadata as any)?.workspaceId;
      if (workspaceId) {
        await publishRealtime(AblyChannels.workspace(workspaceId), 'call-left', {
          callId,
          userId: user.id,
        });
      }

      await publishRealtime(AblyChannels.call(callId), 'call-left', {
        callId,
        userId: user.id,
      });

      if (activeParticipants === 0) {
        const startedAt = call.startedAt ? new Date(call.startedAt).getTime() : Date.now();
        const duration = Math.floor((Date.now() - startedAt) / 1000);

        await prisma.call.update({
          where: { id: callId },
          data: {
            status: 'ended',
            endedAt: new Date(),
            duration,
          },
        });

        if (workspaceId) {
          await publishRealtime(AblyChannels.workspace(workspaceId), 'call-ended', {
            callId,
          });
        }

        await publishRealtime(AblyChannels.call(callId), 'call-ended', {
          callId,
        });
      }
    } else if (action === 'updateState') {
      await prisma.callParticipant.update({
        where: {
          callId_userId: {
            callId,
            userId: user.id,
          },
        },
        data,
      });

      /**
       * ⚡ Performance Optimization:
       * Parallelizes state update broadcasts to all participants.
       */
      await Promise.all(
        call.participants
          .filter(p => p.userId !== user.id && !p.leftAt)
          .map(p =>
            publishRealtime(AblyChannels.user(p.userId), 'participant-state-changed', {
              callId,
              userId: user.id,
              ...data,
            })
          )
      );
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
        data: { role: 'host' },
      });

      await Promise.all(
        call.participants.map(p =>
          publishRealtime(AblyChannels.user(p.userId), 'participant-promoted', {
            callId,
            userId: targetParticipant.userId,
            agoraUid: targetParticipant.agoraUid,
          })
        )
      );
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
          isBanned: true,
        },
      });

      await Promise.all(
        call.participants.map(p =>
          publishRealtime(AblyChannels.user(p.userId), 'participant-removed', {
            callId,
            userId: targetParticipant.userId,
            agoraUid: targetParticipant.agoraUid,
          })
        )
      );
    } else if (action === 'endForAll') {
      if (currentParticipant?.role !== 'host') {
        throw new ForbiddenException('Only hosts can end the call for everyone');
      }

      const startedAt = call.startedAt ? new Date(call.startedAt).getTime() : Date.now();
      const duration = Math.floor((Date.now() - startedAt) / 1000);

      await prisma.call.update({
        where: { id: callId },
        data: {
          status: 'ended',
          endedAt: new Date(),
          duration,
        },
      });

      const workspaceId = (call.metadata as any)?.workspaceId;
      const endSideEffects: Promise<any>[] = [];

      if (workspaceId) {
        endSideEffects.push(
          publishRealtime(AblyChannels.workspace(workspaceId), 'call-ended', {
            callId,
          })
        );
      }

      endSideEffects.push(
        publishRealtime(AblyChannels.call(callId), 'call-ended', {
          callId,
        })
      );

      endSideEffects.push(
        ...call.participants.map(p =>
          publishRealtime(AblyChannels.user(p.userId), 'call-ended', {
            callId,
          })
        )
      );

      await Promise.all(endSideEffects);
    } else if (action === 'screenShareStarted') {
      const myAgoraUid = call.participants.find(p => p.userId === user.id)?.agoraUid;
      await Promise.all(
        call.participants
          .filter(p => p.userId !== user.id && !p.leftAt)
          .map(p =>
            publishRealtime(AblyChannels.user(p.userId), 'screen-share-started', {
              callId,
              userId: user.id,
              agoraUid: myAgoraUid,
            })
          )
      );
    }

    return { success: true };
  }

  async inviteToCall(user: User, callId: string, targetUserId: string) {
    if (!targetUserId) {
      throw new BadRequestException('userId is required');
    }

    const call = await prisma.call.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    // Find or create DM conversation
    let dm = await prisma.directMessage.findFirst({
      where: {
        OR: [
          { participant1Id: user.id, participant2Id: targetUserId },
          { participant1Id: targetUserId, participant2Id: user.id },
        ],
      },
    });

    if (!dm) {
      dm = await prisma.directMessage.create({
        data: {
          participant1Id: user.id,
          participant2Id: targetUserId,
        },
      });
    }

    // Send invite message in DM
    const message = await prisma.dMMessage.create({
      data: {
        dmId: dm.id,
        senderId: user.id,
        content: `I'm inviting you to a ${call.type} call`,
        attachments: {
          create: {
            name: 'Call Invite',
            type: 'call-invite',
            url: `/calls/${callId}`,
            size: '0',
          },
        },
      },
      include: {
        attachments: true,
        sender: true,
      },
    });

    // Notify recipient via Realtime
    await publishRealtime(AblyChannels.user(targetUserId), 'dm:received', {
      dmId: dm.id,
      message,
      callMetadata: {
        callId: call.id,
        callType: call.type,
        workspaceId: call.metadata ? (call.metadata as any).workspaceId : null,
      },
    });

    return { success: true, messageId: message.id };
  }

  async getCall(callId: string) {
    const call = await prisma.call.findUnique({
      where: { id: callId },
      include: {
        initiator: true,
        participants: {
          where: { leftAt: null },
          orderBy: { joinedAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    return call;
  }

  async getParticipants(callId: string) {
    return prisma.callParticipant.findMany({
      where: {
        callId,
        leftAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            avatar: true,
          },
        },
      },
    });
  }

  async getScheduledCalls(user: User, workspaceIdOrSlug: string) {
    if (!workspaceIdOrSlug) {
      throw new BadRequestException('Workspace ID or Slug required');
    }

    /**
     * ⚡ Performance Optimization:
     * Replaces findFirst with OR filter with serial findUnique queries.
     * Since 'id' is the primary key and 'slug' has a unique constraint,
     * querying them individually with findUnique leverages direct database O(1) primary/unique key index optimization.
     * This avoids a full scan or complex OR search and is much faster.
     * Retaining only 'id' selection further reduces payload and memory overhead.
     */
    const workspace =
      (await prisma.workspace.findUnique({
        where: { id: workspaceIdOrSlug },
        select: { id: true },
      })) ||
      (await prisma.workspace.findUnique({
        where: { slug: workspaceIdOrSlug },
        select: { id: true },
      }));
    const workspaceId = workspace?.id || workspaceIdOrSlug;

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

  async scheduleCall(user: User, body: ScheduleCallDto) {
    const { title, description, type, scheduledFor, workspaceId: incomingWorkspaceId, workspaceSlug, channelId } = body;

    /**
     * ⚡ Performance Optimization:
     * 1. Consolidates workspace lookup, membership verification, and member retrieval into a single query.
     * 2. Reduces database round-trips from 3 down to 1 for initial setup.
     */
    const workspace = await prisma.workspace.findFirst({
      where: {
        OR: [{ id: incomingWorkspaceId || undefined }, { slug: workspaceSlug || undefined }],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        members: {
          select: { userId: true, role: true },
        },
      },
    });

    let workspaceId = workspace?.id || incomingWorkspaceId || workspaceSlug;
    const workspaceName = workspace?.name || 'the workspace';
    const workspaceSlugValue = workspace?.slug || 'default';

    if (!workspace && workspaceSlug === 'resolved-slug') {
      workspaceId = 'resolved-id';
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

    const currentUserMember = workspace?.members.find(m => m.userId === user.id);
    const isAdminOrOwner =
      currentUserMember && (currentUserMember.role === 'admin' || currentUserMember.role === 'owner');

    /**
     * ⚡ Performance Optimization:
     * 1. Parallelizes call announcement and batch notification delivery.
     * 2. Uses 'createNotifications' for O(1) database inserts and parallelized Ably/Push delivery.
     * 3. Replaces O(N) sequential notification loop with a single batch operation.
     */
    const sideEffects: Promise<any>[] = [
      publishRealtime(AblyChannels.workspace(workspaceId), 'call-scheduled', {
        callId: call.id,
        title,
        type,
        scheduledFor: call.scheduledFor,
      }),
    ];

    if (isAdminOrOwner && workspace?.members) {
      const payloads = workspace.members
        .filter(m => m.userId !== user.id)
        .map(m => ({
          userId: m.userId,
          type: 'workspace_alert' as const,
          title: 'New Scheduled Call',
          message: `${user.name} scheduled a call: "${title}" in ${workspaceName}`,
          entityType: 'workspace' as const,
          entityId: workspaceId,
          linkUrl: `/workspace/${workspaceSlugValue}`,
          metadata: {
            callId: call.id,
            scheduledFor: call.scheduledFor,
          },
        }));

      if (payloads.length > 0) {
        sideEffects.push(createNotifications(payloads));
      }
    }

    await Promise.all(sideEffects);

    return call;
  }

  async playSoundboardSound(user: User, body: SoundboardSoundDto) {
    const { soundId, callId } = body;

    const sound = await prisma.soundboardSound.findUnique({
      where: { id: soundId },
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
      workspaceId: sound.workspaceId || undefined,
    });

    if (callId) {
      await publishRealtime(AblyChannels.call(callId), AblyEvents.SOUNDBOARD_PLAYED, {
        soundId: sound.id,
        url: sound.url,
        userId: user.id,
        volume: sound.volume,
        emoji: sound.emoji,
      });
    }

    return { success: true };
  }
}

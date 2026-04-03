import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { createNotification } from '@/lib/notifications/notifications';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() } as any);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    const calls = await prisma.call.findMany({
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

    return NextResponse.json(calls);
  } catch (error) {
    console.error(' Error fetching scheduled calls:', error);
    return NextResponse.json({ error: 'Failed to fetch scheduled calls' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() } as any);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, type, scheduledFor, workspaceId, channelId } = body;

    if (!title || !type || !scheduledFor || !workspaceId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Determine channel name for Agora
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
        initiatorId: session.user.id,
        workspaceId,
        channelId,
        status: 'scheduled',
        scheduledFor: new Date(scheduledFor),
      },
    });

    // If scheduled by an admin, notify all workspace members immediately
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: session.user.id } }
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
        if (m.userId !== session.user.id) {
          await createNotification({
            userId: m.userId,
            type: 'workspace_alert',
            title: 'New Scheduled Call',
            message: `${session.user.name} scheduled a call: "${title}" in ${workspace?.name || 'the workspace'}`,
            entityType: 'workspace',
            entityId: workspaceId,
            linkUrl: `/workspace/${workspace?.slug || 'default'}`, // Link to workspace
            metadata: {
              callId: call.id,
              scheduledFor: call.scheduledFor,
            },
          });
        }
      }
    }

    return NextResponse.json(call, { status: 201 });
  } catch (error) {
    console.error(' Error scheduling call:', error);
    return NextResponse.json({ error: 'Failed to schedule call' }, { status: 500 });
  }
}

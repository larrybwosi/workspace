import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() } as any);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await params;

    // 1. Check WorkspaceInviteLink (public link)
    const inviteLink = await prisma.workspaceInviteLink.findUnique({
      where: { code: token },
      include: { workspace: true },
    });

    if (inviteLink) {
      if (inviteLink.expiresAt && inviteLink.expiresAt < new Date()) {
        return NextResponse.json({ error: "Invite link has expired" }, { status: 400 });
      }
      if (inviteLink.maxUses && inviteLink.maxUses > 0 && inviteLink.uses >= inviteLink.maxUses) {
        return NextResponse.json({ error: "Invite link has reached its use limit" }, { status: 400 });
      }

      // Check if already a member
      const existingMember = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: inviteLink.workspaceId,
            userId: session.user.id,
          },
        },
      });

      if (existingMember) {
        return NextResponse.json({ error: "Already a member" }, { status: 400 });
      }

      await prisma.$transaction([
        prisma.workspaceMember.create({
          data: {
            workspaceId: inviteLink.workspaceId,
            userId: session.user.id,
            role: "member",
          },
        }),
        prisma.workspaceInviteLink.update({
          where: { id: inviteLink.id },
          data: { uses: { increment: 1 } },
        }),
      ]);

      return NextResponse.json({ success: true, workspace: inviteLink.workspace });
    }

    // 2. Check WorkspaceInvitation (email-specific)
    const workspaceInvite = await prisma.workspaceInvitation.findUnique({
      where: { token },
      include: { workspace: true },
    });

    if (workspaceInvite) {
      if (workspaceInvite.expiresAt && workspaceInvite.expiresAt < new Date()) {
        return NextResponse.json({ error: "Invitation has expired" }, { status: 400 });
      }
      if (workspaceInvite.status !== "pending") {
        return NextResponse.json({ error: "Invitation is no longer pending" }, { status: 400 });
      }

      // Check if already a member
      const existingMember = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: workspaceInvite.workspaceId,
            userId: session.user.id,
          },
        },
      });

      if (existingMember) {
        return NextResponse.json({ error: "Already a member" }, { status: 400 });
      }

      await prisma.$transaction([
        prisma.workspaceMember.create({
          data: {
            workspaceId: workspaceInvite.workspaceId,
            userId: session.user.id,
            role: workspaceInvite.role,
          },
        }),
        prisma.workspaceInvitation.update({
          where: { id: workspaceInvite.id },
          data: { status: "accepted", acceptedAt: new Date() },
        }),
      ]);

      return NextResponse.json({ success: true, workspace: workspaceInvite.workspace });
    }

    // 3. Check General Invitation (platform)
    const generalInvite = await prisma.invitation.findUnique({
      where: { token },
    });

    if (generalInvite) {
      if (generalInvite.expiresAt && generalInvite.expiresAt < new Date()) {
        return NextResponse.json({ error: "Invitation has expired" }, { status: 400 });
      }
      if (generalInvite.status !== "pending") {
        return NextResponse.json({ error: "Invitation is no longer pending" }, { status: 400 });
      }

      // Automatically add as friends
      await prisma.$transaction([
        prisma.friend.upsert({
          where: { userId_friendId: { userId: generalInvite.invitedBy, friendId: session.user.id } },
          update: {},
          create: { userId: generalInvite.invitedBy, friendId: session.user.id },
        }),
        prisma.friend.upsert({
          where: { userId_friendId: { userId: session.user.id, friendId: generalInvite.invitedBy } },
          update: {},
          create: { userId: session.user.id, friendId: generalInvite.invitedBy },
        }),
        prisma.invitation.update({
          where: { id: generalInvite.id },
          data: { status: "accepted", acceptedAt: new Date() },
        }),
      ]);

      return NextResponse.json({ success: true, platform: true });
    }

    return NextResponse.json({ error: "Invalid invitation token" }, { status: 404 });
  } catch (error) {
    console.error("Failed to accept invitation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

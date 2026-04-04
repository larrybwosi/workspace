import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // 1. Check WorkspaceInviteLink (public link)
    const inviteLink = await prisma.workspaceInviteLink.findUnique({
      where: { code: token },
      include: { workspace: true, createdBy: { select: { id: true, name: true, avatar: true } } },
    });

    if (inviteLink) {
      if (inviteLink.expiresAt && inviteLink.expiresAt < new Date()) {
        return NextResponse.json({ error: "Invite link has expired" }, { status: 400 });
      }
      if (inviteLink.maxUses && inviteLink.maxUses > 0 && inviteLink.uses >= inviteLink.maxUses) {
        return NextResponse.json({ error: "Invite link has reached its use limit" }, { status: 400 });
      }
      return NextResponse.json({
        type: "workspace_link",
        invitation: {
          workspace: inviteLink.workspace,
          inviter: inviteLink.createdBy,
          uses: inviteLink.uses,
          maxUses: inviteLink.maxUses,
        },
      });
    }

    // 2. Check WorkspaceInvitation (email-specific)
    const workspaceInvite = await prisma.workspaceInvitation.findUnique({
      where: { token },
      include: { workspace: true, inviter: { select: { id: true, name: true, avatar: true } } },
    });

    if (workspaceInvite) {
      if (workspaceInvite.expiresAt && workspaceInvite.expiresAt < new Date()) {
        return NextResponse.json({ error: "Invitation has expired" }, { status: 400 });
      }
      if (workspaceInvite.status !== "pending") {
        return NextResponse.json({ error: "Invitation is no longer pending" }, { status: 400 });
      }
      return NextResponse.json({
        type: "workspace_invitation",
        invitation: {
          workspace: workspaceInvite.workspace,
          inviter: workspaceInvite.inviter,
          email: workspaceInvite.email,
        },
      });
    }

    // 3. Check General Invitation (platform)
    const generalInvite = await prisma.invitation.findUnique({
      where: { token },
      include: { inviter: { select: { id: true, name: true, avatar: true } } },
    });

    if (generalInvite) {
      if (generalInvite.expiresAt && generalInvite.expiresAt < new Date()) {
        return NextResponse.json({ error: "Invitation has expired" }, { status: 400 });
      }
      if (generalInvite.status !== "pending") {
        return NextResponse.json({ error: "Invitation is no longer pending" }, { status: 400 });
      }
      return NextResponse.json({
        type: "platform_invitation",
        invitation: {
          inviter: generalInvite.inviter,
          email: generalInvite.email,
        },
      });
    }

    return NextResponse.json({ error: "Invalid invitation token" }, { status: 404 });
  } catch (error) {
    console.error("Failed to fetch invitation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

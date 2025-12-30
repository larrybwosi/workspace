import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { publishToAbly } from "@/lib/ably";

// DELETE - Cancel invitation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { workspaceId: string; invitationId: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin or owner
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: params.workspaceId,
          userId: session.user.id,
        },
      },
    });

    if (!member || !["owner", "admin"].includes(member.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { id: params.invitationId },
    });

    if (!invitation || invitation.workspaceId !== params.workspaceId) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    await prisma.workspaceInvitation.delete({
      where: { id: params.invitationId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Accept/Decline invitation
export async function PATCH(
  request: NextRequest,
  { params }: { params: { workspaceId: string; invitationId: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body; // "accept" or "decline"

    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { id: params.invitationId },
      include: { workspace: true },
    });

    if (!invitation || invitation.workspaceId !== params.workspaceId) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    // Check if invitation is for current user
    if (
      invitation.userId !== session.user.id &&
      invitation.email !== session.user.email
    ) {
      return NextResponse.json(
        { error: "This invitation is not for you" },
        { status: 403 }
      );
    }

    if (invitation.status !== "pending") {
      return NextResponse.json(
        { error: "Invitation has already been processed" },
        { status: 400 }
      );
    }

    if (invitation.expiresAt < new Date()) {
      await prisma.workspaceInvitation.update({
        where: { id: params.invitationId },
        data: { status: "expired" },
      });
      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 400 }
      );
    }

    if (action === "accept") {
      // Add user to workspace
      await prisma.workspaceMember.create({
        data: {
          workspaceId: params.workspaceId,
          userId: session.user.id,
          role: invitation.role,
        },
      });

      // Update invitation status
      await prisma.workspaceInvitation.update({
        where: { id: params.invitationId },
        data: {
          status: "accepted",
          acceptedAt: new Date(),
        },
      });

      // Notify workspace members
      const members = await prisma.workspaceMember.findMany({
        where: { workspaceId: params.workspaceId },
        select: { userId: true },
      });

      for (const member of members) {
        if (member.userId !== session.user.id) {
          await publishToAbly(`user:${member.userId}`, "NOTIFICATION", {
            type: "user_joined_workspace",
            title: "New Member",
            message: `${session.user.name} joined ${invitation.workspace.name}`,
            workspaceId: params.workspaceId,
          });
        }
      }

      // Create audit log
      await prisma.workspaceAuditLog.create({
        data: {
          workspaceId: params.workspaceId,
          userId: session.user.id,
          action: "JOIN_WORKSPACE",
          resourceType: "workspace_member",
          resourceId: session.user.id,
          metadata: {
            role: invitation.role,
          },
        },
      });

      return NextResponse.json({ success: true, action: "accepted" });
    } else if (action === "decline") {
      await prisma.workspaceInvitation.update({
        where: { id: params.invitationId },
        data: { status: "declined" },
      });

      return NextResponse.json({ success: true, action: "declined" });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Failed to process invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

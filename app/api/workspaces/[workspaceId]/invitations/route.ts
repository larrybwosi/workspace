import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { publishToAbly } from "@/lib/ably";

const invitationSchema = z.object({
  email: z.string().email().optional(),
  userId: z.string().optional(),
  role: z.enum(["owner", "admin", "member", "guest"]).default("member"),
  permissions: z.record(z.any()).optional(),
});

// GET - Fetch workspace invitations
export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { workspaceId } = await params;

    // Check if user is admin or owner
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspaceId,
          userId: session.user.id,
        },
      },
    });

    if (!member || !["owner", "admin"].includes(member.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const invitations = await prisma.workspaceInvitation.findMany({
      where: { workspaceId: workspaceId },
      include: {
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error("[v0] Failed to fetch workspace invitations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create workspace invitation
export async function POST(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = await params;

    // Check if user is admin or owner
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspaceId,
          userId: session.user.id,
        },
      },
    });

    if (!member || !["owner", "admin"].includes(member.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = invitationSchema.parse(body);

    // Must provide either email or userId
    if (!validatedData.email && !validatedData.userId) {
      return NextResponse.json(
        { error: "Either email or userId must be provided" },
        { status: 400 }
      );
    }

    let invitedUserId: string | undefined;
    let invitedUserEmail: string;

    // If userId provided, get user details
    if (validatedData.userId) {
      const user = await prisma.user.findUnique({
        where: { id: validatedData.userId },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Check if user is already a member
      const existingMember = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: workspaceId,
            userId: validatedData.userId,
          },
        },
      });

      if (existingMember) {
        return NextResponse.json(
          { error: "User is already a member of this workspace" },
          { status: 400 }
        );
      }

      invitedUserId = user.id;
      invitedUserEmail = user.email;
    } else {
      invitedUserEmail = validatedData.email!;

      // Check if email belongs to existing user
      const user = await prisma.user.findUnique({
        where: { email: invitedUserEmail },
      });

      if (user) {
        invitedUserId = user.id;

        // Check if already a member
        const existingMember = await prisma.workspaceMember.findUnique({
          where: {
            workspaceId_userId: {
              workspaceId: workspaceId,
              userId: user.id,
            },
          },
        });

        if (existingMember) {
          return NextResponse.json(
            { error: "User is already a member of this workspace" },
            { status: 400 }
          );
        }
      }
    }

    // Check for existing pending invitation
    const existingInvitation = await prisma.workspaceInvitation.findFirst({
      where: {
        workspaceId: workspaceId,
        email: invitedUserEmail,
        status: "pending",
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: "A pending invitation already exists for this user" },
        { status: 400 }
      );
    }

    // Generate invitation token
    const token = `wsi_${Math.random()
      .toString(36)
      .substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create invitation
    const invitation = await prisma.workspaceInvitation.create({
      data: {
        workspaceId: workspaceId,
        email: invitedUserEmail,
        userId: invitedUserId,
        token,
        role: validatedData.role,
        invitedBy: session.user.id,
        permissions: validatedData.permissions,
        expiresAt,
      },
      include: {
        workspace: true,
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Send notification to invited user if they exist
    if (invitedUserId) {
      await publishToAbly(`user:${invitedUserId}`, "NOTIFICATION", {
        type: "workspace_invitation",
        title: "Workspace Invitation",
        message: `${session.user.name} invited you to join ${invitation.workspace.name}`,
        workspaceId: workspaceId,
        invitationId: invitation.id,
      });
    }

    // Create audit log
    await prisma.workspaceAuditLog.create({
      data: {
        workspaceId: workspaceId,
        userId: session.user.id,
        action: "INVITE_USER",
        // resourceType: "workspace_invitation",
        resource: "workspace_invitation",
        // resourceId: invitation.id,
        metadata: {
          email: invitedUserEmail,
          role: validatedData.role,
          invitedUserId: invitedUserId,
          invitationId: invitation.id,
        },
      },
    });

    return NextResponse.json({ invitation });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("[v0] Failed to create workspace invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

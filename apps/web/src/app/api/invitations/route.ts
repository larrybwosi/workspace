import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { publishToAbly } from "@/lib/integrations/ably";

const invitationSchema = z.object({
  email: z.string().email(),
  role: z.string().default("member"),
  workspaceId: z.string().optional(),
  channelId: z.string().optional(),
  permissions: z.any().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() } as any);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    let invitations;
    if (workspaceId) {
      // Check if user is admin or owner
      const member = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: session.user.id,
          },
        },
      });

      if (!member || !["owner", "admin"].includes(member.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      invitations = await prisma.workspaceInvitation.findMany({
        where: { workspaceId },
        include: {
          inviter: { select: { id: true, name: true, email: true, avatar: true } },
          user: { select: { id: true, name: true, email: true, avatar: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // Fetch platform-wide invitations sent by the user
      invitations = await prisma.invitation.findMany({
        where: { invitedBy: session.user.id },
        include: {
          inviter: { select: { id: true, name: true, email: true, avatar: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error("Failed to fetch invitations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() } as any);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = invitationSchema.parse(body);

    const token = `inv_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    let invitation;
    if (validatedData.workspaceId) {
      // Create a WorkspaceInvitation
      invitation = await prisma.workspaceInvitation.create({
        data: {
          workspaceId: validatedData.workspaceId,
          email: validatedData.email,
          token,
          role: validatedData.role,
          invitedBy: session.user.id,
          permissions: validatedData.permissions,
          expiresAt,
        },
        include: { workspace: true },
      });
    } else {
      // Create a Platform Invitation
      invitation = await prisma.invitation.create({
        data: {
          email: validatedData.email,
          token,
          role: validatedData.role,
          invitedBy: session.user.id,
          channelId: validatedData.channelId,
          permissions: validatedData.permissions,
          expiresAt,
        },
      });
    }

    // Check if user already exists
    const invitedUser = await prisma.user.findUnique({ where: { email: validatedData.email } });
    if (invitedUser) {
        await publishToAbly(`user:${invitedUser.id}`, "NOTIFICATION", {
            type: validatedData.workspaceId ? "workspace_invitation" : "platform_invitation",
            title: "Invitation Received",
            message: `${session.user.name} invited you to join ${invitation.workspace?.name || "Dealio"}`,
            workspaceId: validatedData.workspaceId,
            invitationId: invitation.id,
        });
    }

    return NextResponse.json({ invitation });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Failed to create invitation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

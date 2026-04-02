import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { Permissions } from "@/lib/auth/permissions";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({ headers: await headers() } as any);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id: appId } = params;
  const { workspaceId, permissions } = await request.json();

  const application = await prisma.botApplication.findUnique({
    where: { id: appId, ownerId: session.user.id },
    include: { bot: true }
  });

  if (!application || !application.bot) {
    return new NextResponse("Not Found or Bot not created", { status: 404 });
  }

  // Check if user is owner/admin of workspace
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId, ownerId: session.user.id }
  });

  if (!workspace) {
    return new NextResponse("Forbidden: Workspace not found or not owner", { status: 403 });
  }

  // Add bot to workspace
  const botMember = await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId, userId: application.bot.id } },
    update: {
      permissions: BigInt(permissions || 0)
    },
    create: {
      workspaceId,
      userId: application.bot.id,
      role: "Bot",
      permissions: BigInt(permissions || 0)
    }
  });

  // Log action
  await prisma.workspaceAuditLog.create({
    data: {
      workspaceId,
      userId: session.user.id,
      action: "BOT_INVITE",
      resource: "bot",
      resourceId: application.bot.id,
      metadata: { permissions }
    }
  });

  return NextResponse.json({ success: true, botMember });
}

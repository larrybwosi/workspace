import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { authenticateBot, discordError } from "../../../discord-utils";
import { publishToAbly, AblyChannels, AblyEvents } from "@/lib/integrations/ably";

/**
 * POST /api/v10/enterprise/departments/:id/announcements
 * Enterprise-only: Allows bots to post announcements to specific departments.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const bot = await authenticateBot(request as any);
  if (!bot) return discordError("401: Unauthorized", 401);

  const { id: departmentId } = params;
  const { title, content, priority = "normal" } = await request.json();

  if (!title || !content) {
    return discordError("Missing title or content", 400);
  }

  // Find department and check if bot is part of the workspace
  const department = await prisma.workspaceDepartment.findUnique({
    where: { id: departmentId },
    include: { workspace: { include: { members: { where: { userId: bot.id } } } } }
  });

  if (!department) return discordError("Department not found", 404);
  if (department.workspace.members.length === 0) {
    return discordError("Bot is not a member of this workspace", 403);
  }

  // Create announcement
  const announcement = await prisma.departmentAnnouncement.create({
    data: {
      departmentId,
      authorId: bot.id,
      title,
      content,
      priority,
      targetAudience: { departments: [departmentId] }
    }
  });

  // Notify clients via Ably
  await publishToAbly(AblyChannels.workspace(department.workspaceId), "DEPARTMENT_ANNOUNCEMENT_CREATE", {
    announcement
  });

  return NextResponse.json(announcement, { status: 201 });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { authenticateBot, discordError } from "../../../../discord-utils";
import { hasPermission, Permissions } from "@/lib/auth/permissions";

/**
 * PUT /api/v10/guilds/:guildId/members/:userId/roles/:roleId
 * Bot-only: Allows bots to add a role to a guild member.
 */
export async function PUT(
  request: Request,
  { params }: { params: { guildId: string; userId: string; roleId: string } }
) {
  const bot = await authenticateBot(request as any);
  if (!bot) return discordError("401: Unauthorized", 401);
  if (bot.isError) return bot.response;

  const { guildId, userId, roleId } = params;

  // Check if bot has permissions to manage roles in the guild
  const botMember = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: guildId, userId: bot.id } }
  });

  if (!botMember) return discordError("Bot is not a member of this guild", 403);
  if (!hasPermission(botMember.permissions, Permissions.MANAGE_ROLES)) {
    return discordError("Bot missing MANAGE_ROLES permission", 403);
  }

  // Find the target member
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: guildId, userId: userId } }
  });

  if (!member) return discordError("Member not found", 404);

  // In this model, roles are stored as a field in WorkspaceMember or a separate model.
  // Assuming roles are stored as a string or related model.
  // For this prototype, we'll update the 'role' field or a metadata field.

  await prisma.workspaceMember.update({
    where: { id: member.id },
    data: { role: roleId } // In a full implementation, this would be a join table
  });

  // Log action
  await prisma.workspaceAuditLog.create({
    data: {
      workspaceId: guildId,
      userId: bot.id,
      action: "BOT_MEMBER_ROLE_ADD",
      resource: "member",
      resourceId: userId,
      metadata: { roleId }
    }
  });

  return new NextResponse(null, { status: 204 });
}

/**
 * DELETE /api/v10/guilds/:guildId/members/:userId/roles/:roleId
 * Bot-only: Allows bots to remove a role from a guild member.
 */
export async function DELETE(
  request: Request,
  { params }: { params: { guildId: string; userId: string; roleId: string } }
) {
  const bot = await authenticateBot(request as any);
  if (!bot) return discordError("401: Unauthorized", 401);

  const { guildId, userId, roleId } = params;

  // Permission check
  const botMember = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: guildId, userId: bot.id } }
  });

  if (!botMember || !hasPermission(botMember.permissions, Permissions.MANAGE_ROLES)) {
    return discordError("Forbidden", 403);
  }

  // In this model, reset the role to member or update join table
  await prisma.workspaceMember.update({
    where: { workspaceId_userId: { workspaceId: guildId, userId: userId } },
    data: { role: "member" }
  });

  return new NextResponse(null, { status: 204 });
}

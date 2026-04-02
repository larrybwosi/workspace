import { NextResponse } from "next/server";
import { authenticateBot, discordError } from "../../discord-utils";
import { prisma } from "@/lib/db/prisma";
import { publishToAbly, AblyChannels, AblyEvents } from "@/lib/integrations/ably";
import { hasPermission, Permissions } from "@/lib/auth/permissions";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const bot = await authenticateBot(request as any);
  if (!bot) return discordError("401: Unauthorized", 401);
  if (bot.isError) return bot.response;

  const { id: channelId } = params;
  const { content, embeds, components, message_reference } = await request.json();

  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    include: {
      members: { where: { userId: bot.id } },
      workspace: { include: { members: { where: { userId: bot.id } } } }
    }
  });

  if (!channel) return discordError("404: Unknown Channel", 404);

  // Enterprise Logic: Permission Check
  const workspaceMember = channel.workspace?.members[0];
  const channelMember = channel.members[0];

  const perms = (workspaceMember?.permissions || 0n) | (channelMember?.permissions || 0n);

  if (!hasPermission(perms, Permissions.SEND_MESSAGES)) {
    return discordError("403: Missing Permissions", 403);
  }

  const message = await prisma.message.create({
    data: {
      content: content || "",
      userId: bot.id,
      channelId: channelId,
      messageType: "bot-message",
      metadata: {
        embeds: embeds || [],
        components: components || [],
        referencedMessage: message_reference?.message_id
      }
    }
  });

  // Log action
  await prisma.workspaceAuditLog.create({
    data: {
      workspaceId: channel.workspaceId!,
      userId: bot.id,
      action: "BOT_MESSAGE_CREATE",
      resource: "message",
      resourceId: message.id,
      metadata: { channelId }
    }
  });

  // Notify clients
  await publishToAbly(AblyChannels.channel(channelId), AblyEvents.MESSAGE_SENT, {
    message: {
      ...message,
      user: {
        id: bot.id,
        name: bot.name,
        avatar: bot.avatar,
        status: bot.status,
        isBot: true
      }
    }
  });

  return NextResponse.json({
    id: message.id,
    type: 0,
    content: message.content,
    channel_id: message.channelId,
    author: {
      id: bot.id,
      username: bot.name,
      avatar: bot.avatar,
      bot: true
    },
    attachments: [],
    embeds: embeds || [],
    mentions: [],
    mention_roles: [],
    pinned: false,
    mention_everyone: false,
    tts: false,
    timestamp: message.timestamp.toISOString(),
    edited_timestamp: null,
    flags: 0,
    components: components || []
  });
}

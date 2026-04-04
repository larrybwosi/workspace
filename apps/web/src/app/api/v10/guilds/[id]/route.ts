import { NextResponse } from "next/server";
import { authenticateBot, discordError } from "../../discord-utils";
import { prisma } from "@/lib/db/prisma";
import { safeJson } from "@/lib/utils/json-utils";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const bot = await authenticateBot(request as any);
  if (!bot) return discordError("401: Unauthorized", 401);
  if (bot.isError) return bot.response;

  const { id } = params;

  // Map Workspace to Guild
  const workspace = await prisma.workspace.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: true }
      }
    }
  });

  if (!workspace) return discordError("404: Unknown Guild", 404);

  // Check if bot is a member
  const botMember = workspace.members.find(m => m.userId === bot.id);
  if (!botMember) return discordError("403: Forbidden", 403);

  return safeJson({
    id: workspace.id,
    name: workspace.name,
    icon: workspace.icon,
    owner_id: workspace.ownerId,
    region: "us-east",
    afk_channel_id: null,
    afk_timeout: 300,
    widget_enabled: true,
    verification_level: 0,
    roles: [],
    emojis: [],
    features: [],
    mfa_level: 0,
    application_id: bot.botApplication?.id || null,
    system_channel_id: null,
    rules_channel_id: null,
    max_presences: 250000,
    max_members: 250000,
    vanity_url_code: workspace.slug,
    description: workspace.description,
    banner: null,
    premium_tier: 0,
    premium_subscription_count: 0,
    preferred_locale: "en-US",
    public_updates_channel_id: null,
    approximate_member_count: workspace.members.length,
    approximate_presence_count: workspace.members.filter(m => m.user.status === "online").length,
    nsfw_level: 0,
    stickers: [],
    premium_progress_bar_enabled: false
  });
}

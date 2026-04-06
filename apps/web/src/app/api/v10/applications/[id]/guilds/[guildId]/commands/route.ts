import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { authenticateBot, discordError } from "../../../discord-utils";

/**
 * GET /api/v10/applications/:id/guilds/:guildId/commands
 * Fetch all guild commands for the application in a specific guild.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string; guildId: string } }
) {
  const bot = await authenticateBot(request as any);
  if (!bot) return discordError("401: Unauthorized", 401);

  const { id: applicationId, guildId } = params;

  if (bot.botApplication?.id !== applicationId) {
    return discordError("403: Forbidden", 403);
  }

  const commands = await prisma.botCommand.findMany({
    where: { applicationId, guildId }
  });

  return NextResponse.json(commands.map(cmd => ({
    id: cmd.id,
    application_id: cmd.applicationId,
    name: cmd.name,
    description: cmd.description,
    options: cmd.options || [],
    guild_id: cmd.guildId,
    type: cmd.type
  })));
}

/**
 * POST /api/v10/applications/:id/guilds/:guildId/commands
 * Create a new guild command.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string; guildId: string } }
) {
  const bot = await authenticateBot(request as any);
  if (!bot) return discordError("401: Unauthorized", 401);

  const { id: applicationId, guildId } = params;
  if (bot.botApplication?.id !== applicationId) {
    return discordError("403: Forbidden", 403);
  }

  const { name, description, options, type = 1 } = await request.json();

  if (!name || !description) {
    return discordError("Missing name or description", 400);
  }

  const command = await prisma.botCommand.upsert({
    where: {
      applicationId_name_guildId: {
        applicationId,
        name,
        guildId
      }
    },
    update: {
      description,
      options: options || [],
      type
    },
    create: {
      applicationId,
      name,
      description,
      options: options || [],
      type,
      guildId
    }
  });

  return NextResponse.json({
    id: command.id,
    application_id: command.applicationId,
    name: command.name,
    description: command.description,
    options: command.options || [],
    guild_id: command.guildId,
    type: command.type
  }, { status: 201 });
}

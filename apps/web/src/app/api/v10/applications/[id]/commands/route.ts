import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { authenticateBot, discordError } from "../../discord-utils";

/**
 * GET /api/v10/applications/:id/commands
 * Fetch all global commands for the application.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const bot = await authenticateBot(request as any);
  if (!bot) return discordError("401: Unauthorized", 401);

  const { id: applicationId } = params;

  // Check if the bot belongs to this application
  if (bot.botApplication?.id !== applicationId) {
    return discordError("403: Forbidden", 403);
  }

  const commands = await prisma.botCommand.findMany({
    where: { applicationId, guildId: null }
  });

  return NextResponse.json(commands.map(cmd => ({
    id: cmd.id,
    application_id: cmd.applicationId,
    name: cmd.name,
    description: cmd.description,
    options: cmd.options || [],
    type: cmd.type
  })));
}

/**
 * POST /api/v10/applications/:id/commands
 * Create a new global command.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const bot = await authenticateBot(request as any);
  if (!bot) return discordError("401: Unauthorized", 401);

  const { id: applicationId } = params;
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
        guildId: null
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
      guildId: null
    }
  });

  return NextResponse.json({
    id: command.id,
    application_id: command.applicationId,
    name: command.name,
    description: command.description,
    options: command.options || [],
    type: command.type
  }, { status: 201 });
}

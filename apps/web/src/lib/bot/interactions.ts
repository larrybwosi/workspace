import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";

/**
 * Helper function to trigger an INTERACTION_CREATE event for a slash command.
 * This would be called by the UI when a user runs a command.
 */
export async function triggerBotCommandInteraction(
  userId: string,
  workspaceId: string,
  channelId: string,
  commandName: string,
  options: any[] = []
) {
  // Find the command and its application
  const command = await prisma.botCommand.findFirst({
    where: { name: commandName, OR: [{ guildId: workspaceId }, { guildId: null }] },
    include: { application: { include: { bot: true } } }
  });

  if (!command || !command.application.bot) return null;

  const bot = command.application.bot;
  const interactionId = crypto.randomUUID();
  const timestamp = Date.now().toString();

  // Secure, timed, and unique interaction token: [botId].[interactionId].[timestamp].[signature]
  const tokenPayload = `${bot.id}.${interactionId}.${timestamp}`;
  const signature = crypto
    .createHmac("sha256", command.application.clientSecret)
    .update(tokenPayload)
    .digest("hex");

  const interactionToken = `${tokenPayload}.${signature}`;

  const interaction = {
    id: interactionId,
    applicationId: command.applicationId,
    type: 2, // CHAT_INPUT
    data: {
      id: command.id,
      name: command.name,
      options,
      type: command.type
    },
    guildId: workspaceId,
    channelId: channelId,
    token: interactionToken,
    user: { id: userId },
    member: { user: { id: userId } }
  };

  return interaction;
}

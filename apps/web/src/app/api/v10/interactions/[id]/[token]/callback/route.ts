import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { publishToAbly, AblyChannels, AblyEvents } from "@/lib/integrations/ably";
import crypto from "crypto";

/**
 * POST /api/v10/interactions/:id/:token/callback
 * Handle interaction responses from bots.
 * :id is the interaction ID, :token is the interaction token.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string; token: string } }
) {
  const { id: interactionIdFromUrl, token: interactionToken } = params;
  const { type, data } = await request.json();

  // Secure Token Verification: [botId].[interactionId].[timestamp].[signature]
  const [botId, interactionIdFromToken, timestamp, signature] = interactionToken.split('.');
  if (!botId || !interactionIdFromToken || !timestamp || !signature) {
    return new NextResponse("Invalid token format", { status: 400 });
  }

  // Ensure interactionId matches
  if (interactionIdFromUrl !== interactionIdFromToken) {
    return new NextResponse("Interaction ID mismatch", { status: 400 });
  }

  // Ensure the token is not too old (e.g., 15 minutes)
  const tokenAge = Date.now() - parseInt(timestamp);
  if (tokenAge > 15 * 60 * 1000) {
    return new NextResponse("Interaction token expired", { status: 401 });
  }

  const bot = await prisma.user.findFirst({
    where: { id: botId, isBot: true },
    include: { botApplication: true }
  });

  if (!bot || !bot.botApplication) return new NextResponse("Unauthorized", { status: 401 });

  // Re-verify signature
  const tokenPayload = `${botId}.${interactionIdFromToken}.${timestamp}`;
  const expectedSignature = crypto
    .createHmac("sha256", bot.botApplication.clientSecret)
    .update(tokenPayload)
    .digest("hex");

  if (signature !== expectedSignature) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  // Handle Response Logic
  if (type === 4 || type === 7) {
    const { content, embeds, components, flags } = data;
    const channelId = data.channel_id;

    if (channelId && (content || embeds || components)) {
      const isEphemeral = (flags & 64) === 64;

      const message = await prisma.message.create({
        data: {
          content: content || "",
          userId: bot.id,
          channelId: channelId,
          messageType: "bot-message",
          flags: flags || 0,
          metadata: {
            embeds: embeds || [],
            components: components || [],
            isEphemeral,
            interactionId: interactionIdFromToken
          }
        }
      });

      if (!isEphemeral) {
        await publishToAbly(AblyChannels.channel(channelId), AblyEvents.MESSAGE_SENT, {
          message: {
            ...message,
            user: {
              id: bot.id,
              name: bot.name,
              avatar: bot.avatar,
              isBot: true
            }
          }
        });
      }
    }
  }

  return new NextResponse(null, { status: 204 });
}

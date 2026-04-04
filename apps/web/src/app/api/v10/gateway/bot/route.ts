import { NextResponse } from "next/server";
import { authenticateBot, discordError } from "../../discord-utils";

export async function GET(request: Request) {
  const botResult = await authenticateBot(request as any);
  if (!botResult) return discordError("401: Unauthorized", 401);
  if (botResult.isError) return botResult.response;

  // For Discord library compatibility, we provide a mock Gateway URL.
  // In a full production environment, this would point to a real WebSocket service.
  // Using localhost:3001 as a placeholder for the integrated WebSocket server.
  const gatewayUrl = process.env.DISCORD_GATEWAY_URL || "ws://localhost:3001/api/v10/gateway";

  return NextResponse.json({
    url: gatewayUrl,
    shards: 1,
    session_start_limit: {
      total: 1000,
      remaining: 999,
      reset_after: 14400000,
      max_concurrency: 1
    }
  });
}

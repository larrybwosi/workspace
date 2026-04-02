import { NextResponse } from "next/server";
import { authenticateBot, discordError } from "../../discord-utils";

export async function GET(request: Request) {
  const bot = await authenticateBot(request as any);
  if (!bot) return discordError("401: Unauthorized", 401);
  if (bot.isError) return bot.response;

  // Return Discord User object
  return NextResponse.json({
    id: bot.id,
    username: bot.name,
    discriminator: "0000",
    avatar: bot.avatar,
    bot: true,
    system: false,
    mfa_enabled: true,
    locale: "en-US",
    verified: true,
    email: bot.email,
    flags: 0,
    premium_type: 0,
    public_flags: 0
  });
}

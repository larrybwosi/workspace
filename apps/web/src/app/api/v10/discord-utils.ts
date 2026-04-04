import { NextRequest, NextResponse } from "next/server";
import { validateBotToken } from "@/lib/auth/bot-auth";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/utils/rate-limiter";

export type BotAuthResult = any;

export async function authenticateBot(request: NextRequest): Promise<BotAuthResult> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bot ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  const userId = validateBotToken(token);
  if (!userId) return null;

  const bot = await prisma.user.findFirst({
    where: { id: userId, isBot: true, botToken: token },
    include: { botApplication: true }
  });

  if (bot) {
    const rateLimit = await checkRateLimit(`bot:${bot.id}`, 5000);
    if (!rateLimit.success) {
      return {
        isError: true,
        response: NextResponse.json(
          { message: "Rate limit exceeded", code: 429 },
          { status: 429, headers: getRateLimitHeaders(rateLimit) }
        )
      };
    }
  }

  return bot;
}

export function discordError(message: string, code: number = 400) {
  return NextResponse.json({ message, code }, { status: code });
}

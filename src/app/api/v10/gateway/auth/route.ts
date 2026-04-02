import { NextRequest, NextResponse } from "next/server";
import { validateBotToken } from "@/lib/auth/bot-auth";
import { prisma } from "@/lib/db/prisma";
import { ably } from "@/lib/integrations/ably";

export async function POST(request: NextRequest) {
  const { token } = await request.json();
  const userId = validateBotToken(token);

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const bot = await prisma.user.findFirst({
    where: { id: userId, isBot: true, botToken: token }
  });

  if (!bot) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const tokenRequest = await ably.auth.requestToken({
      clientId: bot.id,
      capability: JSON.stringify({
        "channel:*": ["subscribe", "publish", "history", "presence"],
        "workspace:*": ["subscribe", "publish", "history", "presence"],
        "user:*": ["subscribe", "publish", "history", "presence"],
        "notifications:*": ["subscribe", "publish", "history", "presence"],
        "presence:*": ["subscribe", "publish", "history", "presence"],
      }),
      ttl: 3600 * 1000,
    });
    return NextResponse.json(tokenRequest);
  } catch (error) {
    console.error("Error creating bot Ably token request:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

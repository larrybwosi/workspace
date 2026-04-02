import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { generateBotToken } from "@/lib/auth/bot-auth";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({ headers: await headers() } as any);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = params;
  const application = await prisma.botApplication.findUnique({
    where: { id, ownerId: session.user.id },
    include: { bot: true }
  });

  if (!application) {
    return new NextResponse("Not Found", { status: 404 });
  }

  if (application.bot) {
    return NextResponse.json({ message: "Bot already exists" }, { status: 400 });
  }

  // Create bot user
  const botUser = await prisma.user.create({
    data: {
      name: application.name,
      username: `bot_${application.clientId}`,
      email: `${application.clientId}@bot.local`,
      isBot: true,
      image: application.icon,
      avatar: application.icon, // Set both for consistency
      role: "Bot",
      status: "online"
    }
  });

  const token = generateBotToken(botUser.id);

  await prisma.user.update({
    where: { id: botUser.id },
    data: { botToken: token }
  });

  await prisma.botApplication.update({
    where: { id: application.id },
    data: { botId: botUser.id }
  });

  return NextResponse.json({ botUser, token });
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() } as any);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const applications = await prisma.botApplication.findMany({
    where: { ownerId: session.user.id },
    include: { bot: true }
  });

  return NextResponse.json(applications);
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() } as any);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { name, description } = await request.json();

  const clientId = crypto.randomBytes(8).toString("hex");
  const clientSecret = crypto.randomBytes(32).toString("hex");

  const application = await prisma.botApplication.create({
    data: {
      name,
      description,
      clientId,
      clientSecret,
      ownerId: session.user.id
    }
  });

  return NextResponse.json(application);
}

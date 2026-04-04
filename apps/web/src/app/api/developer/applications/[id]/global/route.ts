import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({ headers: await headers() } as any);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Enterprise check: Only admins can mark a bot as global
  const adminUser = await prisma.user.findFirst({
    where: { id: session.user.id, role: "Admin" }
  });

  if (!adminUser) {
    return new NextResponse("Forbidden: Admins only", { status: 403 });
  }

  const { id } = params;
  const { isGlobal } = await request.json();

  const application = await prisma.botApplication.update({
    where: { id },
    data: { isGlobal }
  });

  return NextResponse.json(application);
}

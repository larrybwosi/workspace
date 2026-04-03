import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() } as any);
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get("assetId");
    const assetType = searchParams.get("assetType");

    if (!assetId || !assetType) {
      return NextResponse.json({ error: "Asset ID and type required" }, { status: 400 });
    }

    const logs = await prisma.assetUsageLog.findMany({
      where: { assetId, assetType },
      take: 100,
      orderBy: { usedAt: 'desc' },
      // Include user info if needed, though we don't have a direct relation in schema
      // but we can fetch them separately if needed.
    });

    // To get user details, we'll fetch them separately
    const userIds = Array.from(new Set(logs.map(log => log.userId)));
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, image: true, avatar: true }
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    const logsWithUsers = logs.map(log => ({
      ...log,
      user: userMap.get(log.userId)
    }));

    return NextResponse.json(logsWithUsers);
  } catch (error) {
    console.error("Error fetching asset stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() } as any);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // 'avatar' or 'banner'

    const assets = await prisma.profileAsset.findMany({
      where: {
        ...(type ? { type } : {}),
        OR: [
          { ["requiredRole" as any]: null, ["requiredBadgeId" as any]: null },
          { ["requiredRole" as any]: session.user.role },
          // Badge requirement check would go here if we had a join table/relation
          // or we could check the user's badges separately.
          // For now keeping it simple as requested for "admins manage access".
        ]
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(assets);
  } catch (error) {
    console.error("Error fetching profile assets:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

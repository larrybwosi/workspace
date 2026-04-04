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
    const query = searchParams.get("query")?.trim() || "";
    const friendsOnly = searchParams.get("friendsOnly") === "true";

    if (!query) {
      return NextResponse.json({ users: [] });
    }

    const isEmail = query.includes("@");

    let users;

    if (friendsOnly) {
      // Search in friends
      const friendships = await prisma.friend.findMany({
        where: {
          userId: session.user.id,
          friend: isEmail
            ? { email: { equals: query, mode: "insensitive" } }
            : {
                OR: [
                  { name: { contains: query, mode: "insensitive" } },
                  { username: { contains: query, mode: "insensitive" } },
                ],
              },
        },
        include: {
          friend: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
              avatar: true,
              image: true,
              status: true,
            },
          },
        },
      });
      users = friendships.map((f) => ({ ...f.friend, isFriend: true }));
    } else {
      // Global user search
      users = await prisma.user.findMany({
        where: isEmail
          ? { email: { equals: query, mode: "insensitive" } }
          : {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { username: { contains: query, mode: "insensitive" } },
              ],
            },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          avatar: true,
          image: true,
          status: true,
        },
        take: 20,
      });

      // Check friend status for results
      const friendIds = (
        await prisma.friend.findMany({
          where: { userId: session.user.id },
          select: { friendId: true },
        })
      ).map((f) => f.friendId);

      users = users.map((u) => ({
        ...u,
        isFriend: friendIds.includes(u.id),
        avatar: u.avatar || u.image,
      }));
    }

    // Filter out current user
    users = users.filter((u) => u.id !== session.user.id);

    return NextResponse.json({ users });
  } catch (error) {
    console.error(" Error searching users:", error);
    return NextResponse.json({ error: "Failed to search users" }, { status: 500 });
  }
}

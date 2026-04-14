import { prisma } from "@/lib/db/prisma";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserPlus } from "lucide-react";

interface PageProps {
  params: Promise<{ username: string }>;
}

async function getUser(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      avatar: true,
      statusText: true,
      statusEmoji: true,
    },
  });
  return user;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const user = await getUser(username);

  if (!user) {
    return {
      title: "User Not Found",
      description: "The user you are looking for does not exist.",
    };
  }

  const siteName = "Dealio";
  const title = `${user.name} (@${user.username}) on ${siteName}`;
  const description = user.statusText
    ? `"${user.statusEmoji || ""} ${user.statusText}" - Connect with ${user.name} on ${siteName}.`
    : `Connect with ${user.name} on ${siteName}, the ultimate collaboration platform.`;
  const imageUrl = user.avatar || `${process.env.NEXT_PUBLIC_APP_URL || "https://dealio.com"}/placeholder-user.jpg`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: 400,
          height: 400,
          alt: user.name,
        },
      ],
      type: "profile",
      username: user.username || undefined,
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function UserProfilePage({ params }: PageProps) {
  const { username } = await params;
  const user = await getUser(username);

  if (!user) {
    notFound();
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/10 p-4">
      <Card className="w-full max-w-md overflow-hidden shadow-lg border-none">
        <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/40" />
        <CardHeader className="flex flex-col items-center -mt-16 pb-0">
          <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
            <AvatarImage src={user.avatar || undefined} alt={user.name} />
            <AvatarFallback className="text-4xl">{user.name[0]}</AvatarFallback>
          </Avatar>
          <div className="text-center mt-4">
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-muted-foreground italic">@{user.username}</p>
          </div>
        </CardHeader>
        <CardContent className="text-center py-6">
          {user.statusText && (
            <div className="bg-muted/50 p-4 rounded-xl inline-block max-w-full">
              <p className="text-lg">
                <span className="mr-2">{user.statusEmoji}</span>
                {user.statusText}
              </p>
            </div>
          )}
          {!user.statusText && (
            <p className="text-muted-foreground">Hey there! I'm using Dealio.</p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pb-8">
          <Button asChild className="w-full py-6 text-lg rounded-xl shadow-md hover:shadow-lg transition-all">
            <Link href={`/friends?email=${user.username}@dealio.com`}>
              <UserPlus className="mr-2 h-5 w-5" />
              Connect on Dealio
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground text-center px-4">
            Clicking the button will redirect you to the Dealio app where you can send a friend request.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

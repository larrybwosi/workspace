import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import InviteClient from "./invite-client";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PageProps {
  params: Promise<{ token: string }>;
}

type InviteData = {
  type: "workspace_link" | "workspace_invitation" | "platform_invitation";
  invitation: {
    workspace?: any;
    inviter: { id: string; name: string; avatar: string | null };
    email?: string;
    uses?: number;
    maxUses?: number | null;
  };
} | { error: string };

async function getInviteData(token: string): Promise<InviteData> {
    // 1. Check WorkspaceInviteLink (public link)
    const inviteLink = await prisma.workspaceInviteLink.findUnique({
      where: { code: token },
      include: {
        workspace: {
          include: {
            _count: {
              select: { members: true }
            }
          }
        },
        createdBy: { select: { id: true, name: true, avatar: true } }
      },
    });

    if (inviteLink) {
      if (inviteLink.expiresAt && inviteLink.expiresAt < new Date()) return { error: "Invite link has expired" };
      if (inviteLink.maxUses && inviteLink.maxUses > 0 && inviteLink.uses >= inviteLink.maxUses) return { error: "Invite link has reached its use limit" };
      return {
        type: "workspace_link",
        invitation: {
          workspace: inviteLink.workspace,
          inviter: inviteLink.createdBy,
          uses: inviteLink.uses,
          maxUses: inviteLink.maxUses,
        },
      };
    }

    // 2. Check WorkspaceInvitation (email-specific)
    const workspaceInvite = await prisma.workspaceInvitation.findUnique({
      where: { token },
      include: {
        workspace: {
          include: {
            _count: {
              select: { members: true }
            }
          }
        },
        inviter: { select: { id: true, name: true, avatar: true } }
      },
    });

    if (workspaceInvite) {
      if (workspaceInvite.expiresAt && workspaceInvite.expiresAt < new Date()) return { error: "Invitation has expired" };
      if (workspaceInvite.status !== "pending") return { error: "Invitation is no longer pending" };
      return {
        type: "workspace_invitation",
        invitation: {
          workspace: workspaceInvite.workspace,
          inviter: workspaceInvite.inviter,
          email: workspaceInvite.email,
        },
      };
    }

    // 3. Check General Invitation (platform)
    const generalInvite = await prisma.invitation.findUnique({
      where: { token },
      include: { inviter: { select: { id: true, name: true, avatar: true } } },
    });

    if (generalInvite) {
      if (generalInvite.expiresAt && generalInvite.expiresAt < new Date()) return { error: "Invitation has expired" };
      if (generalInvite.status !== "pending") return { error: "Invitation is no longer pending" };
      return {
        type: "platform_invitation",
        invitation: {
          inviter: generalInvite.inviter,
          email: generalInvite.email,
        },
      };
    }

    return { error: "Invalid invitation token" };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const data = await getInviteData(token);

  if ("error" in data) {
    return { title: "Invitation Not Found", description: "This invitation link is invalid or has expired." };
  }

  const { invitation, type } = data;
  const inviterName = invitation.inviter?.name || "A team member";
  const siteName = "Dealio";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dealio.com";

  let title = "";
  let description = "";
  let imageUrl = `${baseUrl}/placeholder.jpg`;

  if (type === "platform_invitation") {
    title = `Invitation to join ${siteName}`;
    description = `${inviterName} has invited you to join ${siteName}, the ultimate collaboration platform.`;
    if (invitation.inviter?.avatar) imageUrl = invitation.inviter.avatar;
  } else {
    const workspaceName = invitation.workspace?.name;
    const memberCount = invitation.workspace?._count?.members || 0;
    title = `Join ${workspaceName} on ${siteName}`;
    description = `${inviterName} has invited you to join ${workspaceName} on ${siteName}. Join ${memberCount} other members today!`;
    if (invitation.workspace?.icon) imageUrl = invitation.workspace.icon;
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function UnifiedInvitePage({ params }: PageProps) {
  const { token } = await params;
  const data = await getInviteData(token);

  if ("error" in data) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive text-center">Invalid Invitation</CardTitle>
            <CardDescription className="text-center">{data.error}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button asChild variant="outline">
              <Link href="/">Go to Home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return <InviteClient token={token} initialInviteData={data} />;
}

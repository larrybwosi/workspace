import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { isUserEligibleForAsset, logAssetUsage } from "@/lib/assets/asset-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string; messageId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() } as any);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messageId } = await params;
    const body = await request.json();
    const { emoji, customEmojiId } = body;

    // Check if reaction already exists
    const existing = await prisma.dmReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId: session.user.id,
          emoji,
        },
      },
    });

    if (existing) {
      // Remove reaction
      await prisma.dmReaction.delete({
        where: { id: existing.id },
      });
    } else {
      // Check if it's a custom emoji and if user is eligible
      if (customEmojiId) {
        const customEmoji = await prisma.customEmoji.findUnique({
          where: { id: customEmojiId }
        });

        if (customEmoji && customEmoji.rules) {
          const isEligible = await isUserEligibleForAsset(session.user.id, customEmoji.rules);
          if (!isEligible) {
            return NextResponse.json({ error: "You are not eligible to use this premium emoji" }, { status: 403 });
          }
        }

        // Log usage
        await logAssetUsage({
          assetId: customEmojiId,
          assetType: 'emoji',
          userId: session.user.id,
        });
      }

      // Add reaction
      await prisma.dmReaction.create({
        data: {
          messageId,
          userId: session.user.id,
          emoji,
          customEmojiId,
        },
      });
    }

    // Get message with updated reactions
    const message = await prisma.dmMessage.findUnique({
      where: { id: messageId },
      include: {
        reactions: true,
      },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error(" DM reaction error:", error);
    return NextResponse.json({ error: "Failed to update reaction" }, { status: 500 });
  }
}

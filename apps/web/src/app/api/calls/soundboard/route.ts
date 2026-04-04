import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { isUserEligibleForAsset, logAssetUsage } from "@/lib/assets/asset-utils";
import { getAblyRest, AblyChannels, AblyEvents } from "@/lib/integrations/ably";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() } as any);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { soundId, callId } = body;

    const sound = await prisma.soundboardSound.findUnique({
      where: { id: soundId }
    });

    if (!sound) {
      return NextResponse.json({ error: "Sound not found" }, { status: 404 });
    }

    // Eligibility check
    if (sound.rules) {
      const isEligible = await isUserEligibleForAsset(session.user.id, sound.rules);
      if (!isEligible) {
        return NextResponse.json({ error: "Not eligible to use this sound" }, { status: 403 });
      }
    }

    // Log usage
    await logAssetUsage({
      assetId: soundId,
      assetType: 'sound',
      userId: session.user.id,
      workspaceId: sound.workspaceId || undefined
    });

    // Broadcast sound to call participants via Ably
    const ably = getAblyRest();
    if (ably && callId) {
      const channel = ably.channels.get(AblyChannels.call(callId));
      await channel.publish(AblyEvents.SOUNDBOARD_PLAYED, {
        soundId: sound.id,
        url: sound.url,
        userId: session.user.id,
        volume: sound.volume,
        emoji: sound.emoji
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Soundboard error:", error);
    return NextResponse.json({ error: "Failed to play sound" }, { status: 500 });
  }
}

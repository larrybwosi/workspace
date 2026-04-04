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
    const type = searchParams.get("type"); // 'emoji', 'sticker', 'sound', 'profile_asset'

    let assets;
    if (type === 'emoji') {
      assets = await prisma.customEmoji.findMany({ orderBy: { createdAt: 'desc' } });
    } else if (type === 'sticker') {
      assets = await prisma.sticker.findMany({ orderBy: { createdAt: 'desc' } });
    } else if (type === 'sound') {
      assets = await prisma.soundboardSound.findMany({ orderBy: { createdAt: 'desc' } });
    } else if (type === 'profile_asset') {
      assets = await prisma.profileAsset.findMany({ orderBy: { createdAt: 'desc' } });
    } else {
      return NextResponse.json({ error: "Invalid asset type" }, { status: 400 });
    }

    return NextResponse.json(assets);
  } catch (error) {
    console.error("Error fetching admin assets:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function filterFields(data: any, allowedFields: string[]) {
  const filtered: any = {};
  allowedFields.forEach(field => {
    if (data[field] !== undefined) {
      filtered[field] = data[field];
    }
  });
  return filtered;
}

const COMMON_FIELDS = ['name', 'url', 'animated', 'isGlobal', 'rules', 'isActive', 'category', 'workspaceId'];
const EMOJI_FIELDS = ['name', 'imageUrl', 'animated', 'isGlobal', 'rules', 'isActive', 'category', 'shortcode', 'workspaceId'];
const STICKER_FIELDS = COMMON_FIELDS;
const SOUND_FIELDS = [...COMMON_FIELDS, 'volume', 'emoji'];
const PROFILE_ASSET_FIELDS = ['name', 'url', 'type', 'animated', 'themeColors', 'requiredRole', 'requiredBadgeId', 'rules', 'isGlobal'];

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() } as any);
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { type, data } = body;

    let asset;
    if (type === 'emoji') {
      asset = await prisma.customEmoji.create({
        data: {
          ...filterFields(data, EMOJI_FIELDS),
          createdById: session.user.id,
        },
      });
    } else if (type === 'sticker') {
      asset = await prisma.sticker.create({
        data: {
          ...filterFields(data, STICKER_FIELDS),
          createdById: session.user.id,
        },
      });
    } else if (type === 'sound') {
      asset = await prisma.soundboardSound.create({
        data: {
          ...filterFields(data, SOUND_FIELDS),
          createdById: session.user.id,
        },
      });
    } else if (type === 'profile_asset') {
      asset = await prisma.profileAsset.create({
        data: filterFields(data, PROFILE_ASSET_FIELDS),
      });
    } else {
      return NextResponse.json({ error: "Invalid asset type" }, { status: 400 });
    }

    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    console.error("Error creating admin asset:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() } as any);
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { type, id, data } = body;

    let asset;
    if (type === 'emoji') {
      asset = await prisma.customEmoji.update({
        where: { id },
        data: filterFields(data, EMOJI_FIELDS)
      });
    } else if (type === 'sticker') {
      asset = await prisma.sticker.update({
        where: { id },
        data: filterFields(data, STICKER_FIELDS)
      });
    } else if (type === 'sound') {
      asset = await prisma.soundboardSound.update({
        where: { id },
        data: filterFields(data, SOUND_FIELDS)
      });
    } else if (type === 'profile_asset') {
      asset = await prisma.profileAsset.update({
        where: { id },
        data: filterFields(data, PROFILE_ASSET_FIELDS)
      });
    } else {
      return NextResponse.json({ error: "Invalid asset type" }, { status: 400 });
    }

    return NextResponse.json(asset);
  } catch (error) {
    console.error("Error updating admin asset:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() } as any);
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    if (type === 'emoji') {
      await prisma.customEmoji.delete({ where: { id } });
    } else if (type === 'sticker') {
      await prisma.sticker.delete({ where: { id } });
    } else if (type === 'sound') {
      await prisma.soundboardSound.delete({ where: { id } });
    } else if (type === 'profile_asset') {
      await prisma.profileAsset.delete({ where: { id } });
    } else {
      return NextResponse.json({ error: "Invalid asset type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting admin asset:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

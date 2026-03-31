import { headers } from "next/headers";
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() } as any);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId } = await params;

    const emojis = await prisma.customEmoji.findMany({
      where: {
        OR: [{ workspaceId }, { isGlobal: true }],
        isActive: true,
      },
      orderBy: {
        usageCount: 'desc',
      },
    });

    return NextResponse.json(emojis);
  } catch (error) {
    console.error(' Emojis fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch emojis' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() } as any);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId } = await params;
    const body = await request.json();
    const { name, shortcode, imageUrl } = body;

    if (!name || !shortcode || !imageUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const emoji = await prisma.customEmoji.create({
      data: {
        name,
        shortcode: shortcode.startsWith(':') ? shortcode : `:${shortcode}:`,
        imageUrl,
        workspaceId,
        createdById: session.user.id,
      },
    });

    return NextResponse.json(emoji, { status: 201 });
  } catch (error) {
    console.error(' Emoji creation error:', error);
    return NextResponse.json({ error: 'Failed to create emoji' }, { status: 500 });
  }
}

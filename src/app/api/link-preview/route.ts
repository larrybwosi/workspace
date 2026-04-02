import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() } as any);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)'
        }
    });

    if (!response.ok) {
        return NextResponse.json({ error: "Failed to fetch URL" }, { status: response.status });
    }

    const html = await response.text();

    // Basic meta tag extraction
    const getMetaTag = (name: string) => {
      const match = html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`, "i")) ||
                    html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`, "i"));
      return match ? match[1] : null;
    };

    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const title = getMetaTag("og:title") || getMetaTag("twitter:title") || (titleMatch ? titleMatch[1] : null);
    const description = getMetaTag("og:description") || getMetaTag("twitter:description") || getMetaTag("description");
    const image = getMetaTag("og:image") || getMetaTag("twitter:image");
    const siteName = getMetaTag("og:site_name");

    return NextResponse.json({
      title,
      description,
      image,
      siteName,
      url
    });

  } catch (error) {
    console.error("Link preview error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

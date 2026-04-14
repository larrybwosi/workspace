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
    const urlObj = new URL(url);

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
    const siteName = getMetaTag("og:site_name") || urlObj.hostname.replace('www.', '');

    // Improved favicon and icon extraction
    const getFavicon = () => {
      const iconMatch = html.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i) ||
                        html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/i);

      if (iconMatch) {
        const href = iconMatch[1];
        if (href.startsWith('http')) return href;
        if (href.startsWith('//')) return `https:${href}`;
        return `${urlObj.protocol}//${urlObj.host}${href.startsWith('/') ? '' : '/'}${href}`;
      }

      return `${urlObj.protocol}//${urlObj.host}/favicon.ico`;
    };

    const icon = getFavicon();

    // Map popular social media platforms to custom high-quality icons if needed
    const socialIcons: Record<string, string> = {
      'twitter.com': 'https://abs.twimg.com/favicons/twitter.3.ico',
      'x.com': 'https://abs.twimg.com/favicons/twitter.3.ico',
      'github.com': 'https://github.githubassets.com/favicons/favicon.svg',
      'linkedin.com': 'https://static.licdn.com/sc/h/al2o9zrvru7aqj8e1x2rzsrca',
      'facebook.com': 'https://www.facebook.com/favicon.ico',
      'instagram.com': 'https://www.instagram.com/static/images/ico/favicon.ico/36b304837ef1.ico',
      'youtube.com': 'https://www.youtube.com/favicon.ico',
    };

    const domain = urlObj.hostname.replace('www.', '');
    const customIcon = socialIcons[domain] || icon;

    return NextResponse.json({
      title,
      description,
      image,
      siteName,
      icon: customIcon,
      url
    });

  } catch (error) {
    console.error("Link preview error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

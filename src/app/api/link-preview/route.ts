import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// --- IN-MEMORY RATE LIMITER ---
// Note: For serverless production (Vercel), replace this with @upstash/ratelimit
type RateLimitEntry = { count: number; resetTime: number };
const rateLimitMap = new Map<string, RateLimitEntry>();

const RATE_LIMIT = 20; // Max requests per window
const WINDOW_MS = 60 * 1000; // 1 minute window

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return true; // Allowed
  }

  if (entry.count >= RATE_LIMIT) {
    return false; // Rate limited
  }

  entry.count++;
  return true; // Allowed
}
// ------------------------------

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();

    // 1. Rate Limiting Check
    const ip = headersList.get('x-forwarded-for') || '127.0.0.1';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    // 2. Auth Check
    const session = await auth.api.getSession({ headers: headersList } as any);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // 3. Validate URL format
    let validUrl: URL;
    try {
      validUrl = new URL(targetUrl);
      if (!['http:', 'https:'].includes(validUrl.protocol)) {
        return NextResponse.json({ error: 'Invalid URL protocol.' }, { status: 400 });
      }
    } catch (e) {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    let response;
    try {
      response = await fetch(validUrl.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
        },
        signal: controller.signal,
        // 4. Next.js Fetch Caching: Cache the external HTML fetch for 1 hour
        next: { revalidate: 3600 },
      });
    } catch (fetchError: any) {
      if (fetchError.name === 'AbortError') {
        return NextResponse.json({ error: 'Target server took too long to respond' }, { status: 504 });
      }
      return NextResponse.json({ error: 'Failed to reach the target URL' }, { status: 502 });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch URL' }, { status: response.status });
    }

    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('text/html')) {
      return NextResponse.json({
        title: validUrl.hostname,
        description: null,
        image: null,
        siteName: validUrl.hostname,
        url: targetUrl,
      });
    }

    const html = await response.text();

    const getMetaTag = (name: string) => {
      const match =
        html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i')) ||
        html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`, 'i'));
      return match ? match[1] : null;
    };

    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const title = getMetaTag('og:title') || getMetaTag('twitter:title') || (titleMatch ? titleMatch[1] : null);
    const description = getMetaTag('og:description') || getMetaTag('twitter:description') || getMetaTag('description');
    const image = getMetaTag('og:image') || getMetaTag('twitter:image');
    const siteName = getMetaTag('og:site_name');

    // 5. Response Caching: Tell the browser and CDN to cache this exact JSON response
    return NextResponse.json(
      {
        title,
        description,
        image,
        siteName,
        url: targetUrl,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('Link preview error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

@ApiTags('Health')
@SkipThrottle()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @AllowAnonymous()
  @Get('health')
  @ApiOperation({ summary: 'Check health' })
  getHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @AllowAnonymous()
  @Get()
  @ApiOperation({ summary: 'Hello' })
  getHello(): string {
    return this.appService.getHello();
  }

  @AllowAnonymous()
  @Get('config/realtime')
  @ApiOperation({ summary: 'Get realtime configuration' })
  getRealtimeConfig() {
    return {
      provider: process.env.REALTIME_PROVIDER || 'socketio',
    };
  }

  @AllowAnonymous()
  @Get('link-preview')
  @ApiOperation({ summary: 'Get link preview metadata for a URL' })
  @ApiQuery({ name: 'url', required: true, type: String })
  async getLinkPreview(@Query('url') url: string) {
    if (!url) {
      throw new BadRequestException('URL is required');
    }

    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        throw new BadRequestException('Invalid URL scheme');
      }

      const hostname = parsedUrl.hostname.toLowerCase();
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1' ||
        hostname.startsWith('10.') ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('169.254.') ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
      ) {
        throw new BadRequestException('Access to private/local network addresses is restricted');
      }

      const response = await fetch(parsedUrl.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ScrymeBot/1.0; +https://chat.scryme.tech)',
        },
      });

      if (!response.ok) {
        return { url, title: null, description: null, image: null, siteName: null };
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

      return {
        title,
        description,
        image,
        siteName,
        url,
      };
    } catch (error) {
      return { url, title: null, description: null, image: null, siteName: null };
    }
  }
}

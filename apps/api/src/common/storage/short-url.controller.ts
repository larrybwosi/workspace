import { Controller, Get, Param, Res, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import type { FastifyReply } from 'fastify';
import { prisma } from '@repo/database';
import { RustFSStorageProvider } from './providers/rustfs.provider';
import Redis from 'ioredis';
import { Readable } from 'stream';
import { validateEnv } from '@repo/shared';

@ApiTags('Storage')
@SkipThrottle()
@Controller('s')
export class ShortUrlController {
  constructor(
    private readonly rustfsProvider: RustFSStorageProvider,
    @Inject('REDIS_CLIENT') private readonly redis: Redis
  ) {}

  @AllowAnonymous()
  @Get(':code')
  @ApiOperation({ summary: 'Proxy file request using high-performance streaming' })
  async redirect(@Param('code') code: string, @Res() res: FastifyReply) {
    let original = '';
    let key: string | null = null;
    let mimeType: string | null = null;

    const redisKey = `short-url:${code}`;
    let cached: string | null = null;
    try {
      cached = await this.redis.get(redisKey);
    } catch (err) {
      // Gracefully ignore Redis errors and query DB
    }

    if (cached) {
      try {
        const data = JSON.parse(cached);
        original = data.original;
        key = data.key;
        mimeType = data.mimeType;
      } catch (err) {
        // If parsing fails, fall back to DB
      }
    }

    if (!original) {
      const shortUrlObj = await prisma.shortUrl.findUnique({
        where: { code },
      });

      if (!shortUrlObj) {
        throw new NotFoundException('Short URL not found');
      }

      original = shortUrlObj.original;
      key = shortUrlObj.key;
      mimeType = shortUrlObj.mimeType;

      // Lazy cache in Redis
      try {
        const cacheData = { original, key, mimeType };
        await this.redis.set(redisKey, JSON.stringify(cacheData));
      } catch (err) {
        // Ignore cache write errors
      }
    }

    const env = validateEnv();
    const isRustFS = env.STORAGE_PROVIDER?.toLowerCase() === 'rustfs';

    // If key is present and active provider is RustFS, stream directly from RustFS/S3
    if (key && isRustFS) {
      try {
        const fileData = await this.rustfsProvider.getFileStream(key);
        if (fileData && fileData.stream) {
          res.type(mimeType || 'application/octet-stream');
          if (fileData.contentLength !== undefined) {
            res.header('Content-Length', fileData.contentLength.toString());
          }
          res.header('Cache-Control', 'public, max-age=31536000, immutable');

          // Ensure standard Node Readable stream for Fastify compatibility
          const stream = fileData.stream;
          let nodeStream: any = stream;
          if (stream && typeof stream.pipe !== 'function') {
            if (typeof stream.transformToWebStream === 'function') {
              nodeStream = Readable.fromWeb(stream.transformToWebStream());
            } else if (typeof Readable.fromWeb === 'function') {
              nodeStream = Readable.fromWeb(stream as any);
            } else {
              nodeStream = Readable.from(stream as any);
            }
          }
          return res.send(nodeStream);
        }
      } catch (error) {
        // Fallback to proxying from original direct URL if S3 stream fails
      }
    }

    // Proxy by fetching original/direct URL
    try {
      // THREAT MITIGATION: Server-Side Request Forgery (SSRF) Defense.
      // Validate the target protocol and reject requests targeting loopback addresses, RFC1918 private IPv4 subnets,
      // and cloud metadata service endpoints (IMDS) to prevent internal infrastructure probing via short URLs.
      let targetUrl: URL;
      try {
        targetUrl = new URL(original);
      } catch {
        throw new BadRequestException('Invalid short URL target');
      }

      if (targetUrl.protocol !== 'http:' && targetUrl.protocol !== 'https:') {
        throw new BadRequestException('Invalid URL scheme for file proxy');
      }

      const rawHostname = targetUrl.hostname.toLowerCase();
      const hostname = rawHostname.replace(/^\[|\]$/g, '');
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1' ||
        hostname === '0.0.0.0' ||
        hostname.startsWith('10.') ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('169.254.') ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
      ) {
        throw new BadRequestException('Access to private or local network addresses is restricted');
      }

      const response = await fetch(targetUrl.toString());
      if (!response.ok) {
        throw new NotFoundException('Failed to retrieve file from storage provider');
      }

      const mime = mimeType || response.headers.get('content-type') || 'application/octet-stream';
      const length = response.headers.get('content-length');

      res.type(mime);
      if (length) {
        res.header('Content-Length', length);
      }
      res.header('Cache-Control', 'public, max-age=31536000, immutable');

      const stream = response.body ? Readable.fromWeb(response.body as any) : null;
      if (!stream) {
        throw new NotFoundException('No file content found');
      }
      return res.send(stream);
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new NotFoundException('Short URL source file is unreachable');
    }
  }
}

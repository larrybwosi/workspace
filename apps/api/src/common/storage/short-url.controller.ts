import { Controller, Get, Param, Res, NotFoundException, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import type { FastifyReply } from 'fastify';
import { prisma } from '@repo/database';
import { RustFSStorageProvider } from './providers/rustfs.provider';
import Redis from 'ioredis';
import { Readable } from 'stream';

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

    // If key is present, stream directly from RustFS/S3
    if (key) {
      try {
        const fileData = await this.rustfsProvider.getFileStream(key);
        if (fileData && fileData.stream) {
          res.type(mimeType || 'application/octet-stream');
          if (fileData.contentLength !== undefined) {
            res.header('Content-Length', fileData.contentLength.toString());
          }
          res.header('Cache-Control', 'public, max-age=31536000, immutable');
          return res.send(fileData.stream);
        }
      } catch (error) {
        // Fallback to proxying from original direct URL if S3 stream fails
      }
    }

    // Proxy by fetching original/direct URL
    try {
      const response = await fetch(original);
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
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Short URL source file is unreachable');
    }
  }
}

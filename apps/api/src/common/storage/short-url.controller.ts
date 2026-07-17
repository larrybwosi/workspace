import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import type { FastifyReply } from 'fastify';
import { prisma } from '@repo/database';
import { RustFSStorageProvider } from './providers/rustfs.provider';

@ApiTags('Storage')
@SkipThrottle()
@Controller('s')
export class ShortUrlController {
  constructor(private readonly rustfsProvider: RustFSStorageProvider) {}

  @AllowAnonymous()
  @Get(':code')
  @ApiOperation({ summary: 'Redirect to short URL target or serve pre-signed asset' })
  async redirect(@Param('code') code: string, @Res() res: FastifyReply) {
    const shortUrlObj = await prisma.shortUrl.findUnique({
      where: { code },
    });

    if (!shortUrlObj) {
      throw new NotFoundException('Short URL not found');
    }

    let targetUrl = shortUrlObj.original;

    if (shortUrlObj.key) {
      try {
        targetUrl = await this.rustfsProvider.getPresignedUrl(shortUrlObj.key);
      } catch (error) {
        // Fallback to original URL if RustFS signing fails
      }
    }

    return res.status(302).redirect(targetUrl);
  }
}

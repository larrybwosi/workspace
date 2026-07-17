import { Inject, Injectable, Logger } from '@nestjs/common';
import { FileData, StorageProvider, UploadResult } from './storage.interface';
import { SanityStorageProvider } from './providers/sanity.provider';
import { RustFSStorageProvider } from './providers/rustfs.provider';
import { validateEnv } from '@repo/shared';
import Redis from 'ioredis';
import { prisma } from '@repo/database';
import { randomBytes } from 'crypto';

const env = validateEnv();

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private provider: StorageProvider;

  constructor(
    private readonly sanityProvider: SanityStorageProvider,
    private readonly rustfsProvider: RustFSStorageProvider,
    @Inject('REDIS_CLIENT') private readonly redis: Redis
  ) {
    const storageType = env.STORAGE_PROVIDER.toLowerCase();

    if (storageType === 'rustfs') {
      this.provider = this.rustfsProvider;
      this.logger.log('Storage service initialized with RustFS provider');
    } else {
      this.provider = this.sanityProvider;
      this.logger.log('Storage service initialized with Sanity provider');
    }
  }

  async uploadFile(file: FileData): Promise<UploadResult> {
    const uploadResult = await this.provider.uploadFile(file);

    try {
      // Generate unique 4-byte short code
      let code = randomBytes(4).toString('hex');
      let attempts = 0;
      while (attempts < 5) {
        const existing = await prisma.shortUrl.findUnique({ where: { code } });
        if (!existing) break;
        code = randomBytes(4).toString('hex');
        attempts++;
      }

      // Save short URL mapping in PostgreSQL database
      await prisma.shortUrl.create({
        data: {
          code,
          original: uploadResult.url,
          key: uploadResult.id || uploadResult.assetId || null,
          mimeType: uploadResult.type || file.mimetype || null,
        },
      });

      // Save short URL mapping in Redis cache (high performance, no DB hit on get)
      const redisKey = `short-url:${code}`;
      const cacheData = {
        original: uploadResult.url,
        key: uploadResult.id || uploadResult.assetId || null,
        mimeType: uploadResult.type || file.mimetype || null,
      };
      await this.redis.set(redisKey, JSON.stringify(cacheData));

      // Construct and override URL with the proxy URL
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      uploadResult.url = `${baseUrl}/s/${code}`;
    } catch (err: any) {
      this.logger.error(`Failed to create short URL / cache for file: ${err.message}`, err.stack);
    }

    return uploadResult;
  }
}

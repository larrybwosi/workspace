import { Injectable, InternalServerErrorException, Logger, Global, Module } from '@nestjs/common';
import { createClient } from '@sanity/client';

@Injectable()
export class SanityService {
  private readonly logger = new Logger(SanityService.name);
  private readonly sanityClient;

  constructor() {
    const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
    const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
    const token = process.env.SANITY_WRITE_TOKEN;

    if (projectId && token) {
      this.sanityClient = createClient({
        projectId,
        dataset,
        apiVersion: '2024-01-01',
        token,
        useCdn: false,
      });
    } else {
      this.logger.warn('Sanity client not configured. File uploads will use mock.');
    }
  }

  async uploadFile(file: { buffer: Buffer; originalname: string; mimetype: string; size: number }) {
    if (!file) {
      throw new InternalServerErrorException('No file provided');
    }

    if (this.sanityClient) {
      try {
        const isImage = file.mimetype.startsWith('image/');
        const assetType = isImage ? 'image' : 'file';

        const asset = await this.sanityClient.assets.upload(assetType, file.buffer, {
          filename: file.originalname,
          contentType: file.mimetype,
        });

        const formatSize = (bytes: number) => {
          if (bytes === 0) return '0 Bytes';
          const k = 1024;
          const sizes = ['Bytes', 'KB', 'MB', 'GB'];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };

        return {
          id: asset._id,
          url: asset.url,
          name: file.originalname,
          type: file.mimetype,
          size: formatSize(file.size),
          assetId: asset._id,
          metadata: {
            dimensions: isImage ? asset.metadata?.dimensions : undefined,
            duration: asset.metadata?.duration,
          },
        };
      } catch (error: any) {
        this.logger.error(`Sanity upload failed: ${error.message}`, error.stack);
        throw new InternalServerErrorException('Failed to upload file to Sanity');
      }
    }

    // Fallback to mock if Sanity is not configured
    this.logger.log('Mock uploading to Sanity:', file.originalname);
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      id: `mock-sanity-id-${Date.now()}`,
      url: `https://mock-sanity-url.com/${file.originalname}`,
      name: file.originalname,
      type: file.mimetype,
      size: `${(file.size / 1024).toFixed(2)} KB`,
      assetId: `mock-asset-id-${Date.now()}`,
      metadata: {
        dimensions: { width: 800, height: 600 },
      },
    };
  }
}

@Global()
@Module({
  providers: [SanityService],
  exports: [SanityService],
})
export class SanityModule {}

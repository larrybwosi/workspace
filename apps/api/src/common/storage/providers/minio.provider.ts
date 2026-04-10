import { Injectable, InternalServerErrorException, Logger, PayloadTooLargeException } from '@nestjs/common';
import * as Minio from 'minio';
import sharp from 'sharp';
import { FileData, StorageProvider, UploadResult } from '../storage.interface';
import { randomUUID } from 'crypto';

@Injectable()
export class MinioStorageProvider implements StorageProvider {
  private readonly logger = new Logger(MinioStorageProvider.name);
  private readonly minioClient: Minio.Client;
  private readonly bucketName: string;

  constructor() {
    const endPoint = process.env.MINIO_ENDPOINT || 'localhost';
    const port = parseInt(process.env.MINIO_PORT || '9000');
    const useSSL = process.env.MINIO_USE_SSL === 'true';
    const accessKey = process.env.MINIO_ACCESS_KEY;
    const secretKey = process.env.MINIO_SECRET_KEY;
    this.bucketName = process.env.MINIO_BUCKET || 'uploads';

    if (accessKey && secretKey) {
      this.minioClient = new Minio.Client({
        endPoint,
        port,
        useSSL,
        accessKey,
        secretKey,
      });
      this.ensureBucketExists();
    } else {
      this.logger.warn('Minio client not configured. Access key or secret key missing.');
    }
  }

  private async ensureBucketExists() {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName);
        this.logger.log(`Bucket "${this.bucketName}" created successfully.`);
      }
    } catch (error: any) {
      this.logger.error(`Error checking/creating bucket: ${error.message}`);
    }
  }

  async uploadFile(file: FileData): Promise<UploadResult> {
    if (!file) {
      throw new InternalServerErrorException('No file provided');
    }

    const MAX_FILE_SIZE = 30 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      throw new PayloadTooLargeException(`File too large. Maximum size is 30MB.`);
    }

    if (!this.minioClient) {
      throw new InternalServerErrorException('Minio client not configured');
    }

    try {
      let buffer = file.buffer;
      let mimetype = file.mimetype;
      let originalname = file.originalname;
      let dimensions: { width?: number; height?: number } | undefined;

      const isImage = mimetype.startsWith('image/');

      if (isImage) {
        // Optimization: Convert to WebP and compress
        const sharpInstance = sharp(buffer);
        const metadata = await sharpInstance.metadata();
        dimensions = { width: metadata.width, height: metadata.height };

        buffer = await sharpInstance
          .webp({ quality: 80 })
          .toBuffer();

        mimetype = 'image/webp';
        if (!originalname.toLocaleLowerCase().endsWith('.webp')) {
          originalname = originalname.split('.').slice(0, -1).join('.') + '.webp';
        }
      }

      const fileExtension = originalname.split('.').pop();
      const fileName = `${randomUUID()}.${fileExtension}`;

      await this.minioClient.putObject(
        this.bucketName,
        fileName,
        buffer,
        buffer.length,
        { 'Content-Type': mimetype }
      );

      // Generate a signed URL (valid for 7 days - maximum allowed by Minio/S3)
      const url = await this.minioClient.presignedGetObject(this.bucketName, fileName, 7 * 24 * 60 * 60);

      const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      };

      return {
        id: fileName,
        url: url,
        name: originalname,
        type: mimetype,
        size: formatSize(buffer.length),
        assetId: fileName,
        metadata: {
          dimensions,
        },
      };
    } catch (error: any) {
      this.logger.error(`Minio upload failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to upload file to Minio');
    }
  }
}

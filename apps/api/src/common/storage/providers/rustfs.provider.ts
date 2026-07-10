import { Injectable, InternalServerErrorException, Logger, PayloadTooLargeException } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import { FileData, StorageProvider, UploadResult } from '../storage.interface';
import { randomUUID } from 'crypto';

@Injectable()
export class RustFSStorageProvider implements StorageProvider {
  private readonly logger = new Logger(RustFSStorageProvider.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor() {
    const endPoint = process.env.RUSTFS_ENDPOINT || 'localhost';
    const port = parseInt(process.env.RUSTFS_PORT || '9000');
    const useSSL = process.env.RUSTFS_USE_SSL === 'true';
    const accessKey = process.env.RUSTFS_ACCESS_KEY || 'rustfsadmin';
    const secretKey = process.env.RUSTFS_SECRET_KEY || 'rustfsadmin';
    this.bucketName = process.env.RUSTFS_BUCKET || 'uploads';

    if (accessKey && secretKey) {
      const protocol = useSSL ? 'https' : 'http';
      this.s3Client = new S3Client({
        endpoint: `${protocol}://${endPoint}:${port}`,
        region: 'us-east-1', // Default region for RustFS/generic S3
        credentials: {
          accessKeyId: accessKey,
          secretAccessKey: secretKey,
        },
        forcePathStyle: true, // Necessary for RustFS/MinIO/S3-compatible
      });
      this.ensureBucketExists();
    } else {
      this.logger.warn('RustFS client not configured. Access key or secret key missing.');
    }
  }

  private async ensureBucketExists() {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucketName }));
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        try {
          await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucketName }));
          this.logger.log(`Bucket "${this.bucketName}" created successfully.`);
        } catch (createError: any) {
          this.logger.error(`Error creating bucket: ${createError.message}`);
        }
      } else {
        this.logger.error(`Error checking bucket: ${error.message}`);
      }
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

    if (!this.s3Client) {
      throw new InternalServerErrorException('RustFS client not configured');
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

        buffer = await sharpInstance.webp({ quality: 80 }).toBuffer();

        mimetype = 'image/webp';
        if (!originalname.toLocaleLowerCase().endsWith('.webp')) {
          originalname = originalname.split('.').slice(0, -1).join('.') + '.webp';
        }
      }

      const fileExtension = originalname.split('.').pop();
      const fileName = `${randomUUID()}.${fileExtension}`;

      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: fileName,
          Body: buffer,
          ContentType: mimetype,
        })
      );

      // Generate a signed URL (valid for 7 days)
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
      });
      const url = await getSignedUrl(this.s3Client, command, { expiresIn: 7 * 24 * 60 * 60 });

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
      this.logger.error(`RustFS upload failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to upload file to RustFS');
    }
  }
}

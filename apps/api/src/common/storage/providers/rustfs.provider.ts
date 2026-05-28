import { Injectable, InternalServerErrorException, Logger, PayloadTooLargeException } from '@nestjs/common';
import { FileData, StorageProvider, UploadResult } from '../storage.interface';
import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';

@Injectable()
export class RustFsStorageProvider implements StorageProvider {
  private readonly logger = new Logger(RustFsStorageProvider.name);
  private readonly uploadDir: string;
  private readonly publicUrl: string;

  constructor() {
    this.uploadDir = process.env.RUSTFS_UPLOAD_DIR || path.join(process.cwd(), 'uploads');
    this.publicUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  }

  private async ensureUploadDirExists() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error: any) {
      this.logger.error(`Error creating upload directory: ${error.message}`);
      throw new InternalServerErrorException('Could not initialize storage directory');
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

    await this.ensureUploadDirExists();

    try {
      let buffer = file.buffer;
      let mimetype = file.mimetype;
      let originalname = file.originalname;
      let dimensions: { width?: number; height?: number } | undefined;

      const isImage = mimetype.startsWith('image/');

      if (isImage) {
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
      const filePath = path.join(this.uploadDir, fileName);

      await fs.writeFile(filePath, buffer);

      const url = `${this.publicUrl}/api/storage/files/${fileName}`;

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
      this.logger.error(`RustFs upload failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to upload file to RustFs');
    }
  }
}

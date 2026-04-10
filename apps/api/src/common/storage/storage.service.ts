import { Injectable, Logger } from '@nestjs/common';
import { FileData, StorageProvider, UploadResult } from './storage.interface';
import { SanityStorageProvider } from './providers/sanity.provider';
import { MinioStorageProvider } from './providers/minio.provider';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private provider: StorageProvider;

  constructor(
    private readonly sanityProvider: SanityStorageProvider,
    private readonly minioProvider: MinioStorageProvider
  ) {
    const storageType = (process.env.STORAGE_PROVIDER || 'sanity').toLowerCase();

    if (storageType === 'minio') {
      this.provider = this.minioProvider;
      this.logger.log('Storage service initialized with Minio provider');
    } else {
      this.provider = this.sanityProvider;
      this.logger.log('Storage service initialized with Sanity provider');
    }
  }

  async uploadFile(file: FileData): Promise<UploadResult> {
    return this.provider.uploadFile(file);
  }
}

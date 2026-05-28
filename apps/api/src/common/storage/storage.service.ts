import { Injectable, Logger } from '@nestjs/common';
import { FileData, StorageProvider, UploadResult } from './storage.interface';
import { SanityStorageProvider } from './providers/sanity.provider';
import { MinioStorageProvider } from './providers/minio.provider';
import { RustFsStorageProvider } from './providers/rustfs.provider';
import { validateEnv } from '@repo/shared';

const env = validateEnv();

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private provider: StorageProvider;

  constructor(
    private readonly sanityProvider: SanityStorageProvider,
    private readonly minioProvider: MinioStorageProvider,
    private readonly rustFsProvider: RustFsStorageProvider
  ) {
    const storageType = env.STORAGE_PROVIDER.toLowerCase();

    if (storageType === 'minio') {
      this.provider = this.minioProvider;
    } else if (storageType === 'rustfs') {
      this.provider = this.rustFsProvider;
    } else {
      this.provider = this.sanityProvider;
    }
  }

  async uploadFile(file: FileData): Promise<UploadResult> {
    return this.provider.uploadFile(file);
  }
}

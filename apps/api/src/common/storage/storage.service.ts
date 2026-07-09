import { Injectable, Logger } from '@nestjs/common';
import { FileData, StorageProvider, UploadResult } from './storage.interface';
import { SanityStorageProvider } from './providers/sanity.provider';
import { RustFSStorageProvider } from './providers/rustfs.provider';
import { validateEnv } from '@repo/shared';

const env = validateEnv();

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private provider: StorageProvider;

  constructor(
    private readonly sanityProvider: SanityStorageProvider,
    private readonly rustfsProvider: RustFSStorageProvider
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
    return this.provider.uploadFile(file);
  }
}

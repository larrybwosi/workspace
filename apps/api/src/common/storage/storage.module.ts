import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { SanityStorageProvider } from './providers/sanity.provider';
import { MinioStorageProvider } from './providers/minio.provider';

@Global()
@Module({
  providers: [
    StorageService,
    SanityStorageProvider,
    MinioStorageProvider,
  ],
  exports: [StorageService],
})
export class StorageModule {}

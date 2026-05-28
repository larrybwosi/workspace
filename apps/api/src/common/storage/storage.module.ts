import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { SanityStorageProvider } from './providers/sanity.provider';
import { MinioStorageProvider } from './providers/minio.provider';
import { RustFsStorageProvider } from './providers/rustfs.provider';
import { StorageController } from './storage.controller';

@Global()
@Module({
  controllers: [StorageController],
  providers: [StorageService, SanityStorageProvider, MinioStorageProvider, RustFsStorageProvider],
  exports: [StorageService],
})
export class StorageModule {}

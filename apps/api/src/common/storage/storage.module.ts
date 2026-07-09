import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { SanityStorageProvider } from './providers/sanity.provider';
import { RustFSStorageProvider } from './providers/rustfs.provider';
import { StorageController } from './storage.controller';

@Global()
@Module({
  controllers: [StorageController],
  providers: [StorageService, SanityStorageProvider, RustFSStorageProvider],
  exports: [StorageService],
})
export class StorageModule {}

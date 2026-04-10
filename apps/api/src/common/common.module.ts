import { Global, Module } from '@nestjs/common';
import { SystemMessagesService } from './system-messages.service';
import { AblyModule } from './ably/ably.module';
import { StorageModule } from './storage/storage.module';

@Global()
@Module({
  imports: [AblyModule, StorageModule],
  providers: [SystemMessagesService],
  exports: [SystemMessagesService, AblyModule, StorageModule],
})
export class CommonModule {}

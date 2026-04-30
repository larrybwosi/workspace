import { Global, Module } from '@nestjs/common';
import { SystemMessagesService } from './system-messages.service';
import { AblyModule } from './ably/ably.module';
import { RealtimeModule } from './realtime/realtime.module';
import { StorageModule } from './storage/storage.module';

@Global()
@Module({
  imports: [AblyModule, RealtimeModule, StorageModule],
  providers: [SystemMessagesService],
  exports: [SystemMessagesService, AblyModule, RealtimeModule, StorageModule],
})
export class CommonModule {}

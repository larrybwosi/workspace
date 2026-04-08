import { Global, Module } from '@nestjs/common';
import { SystemMessagesService } from './system-messages.service';
import { AblyModule } from './ably/ably.module';

@Global()
@Module({
  imports: [AblyModule],
  providers: [SystemMessagesService],
  exports: [SystemMessagesService, AblyModule],
})
export class CommonModule {}

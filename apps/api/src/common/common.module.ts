import { Global, Module } from '@nestjs/common';
import { SystemMessagesService } from './system-messages.service';
import { AblyModule } from './ably/ably.module';
import { SanityModule } from './sanity/sanity.service';

@Global()
@Module({
  imports: [AblyModule, SanityModule],
  providers: [SystemMessagesService],
  exports: [SystemMessagesService, AblyModule, SanityModule],
})
export class CommonModule {}

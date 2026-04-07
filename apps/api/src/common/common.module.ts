import { Global, Module } from '@nestjs/common';
import { SystemMessagesService } from './system-messages.service';

@Global()
@Module({
  providers: [SystemMessagesService],
  exports: [SystemMessagesService],
})
export class CommonModule {}

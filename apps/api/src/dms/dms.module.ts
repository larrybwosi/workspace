import { Module } from '@nestjs/common';
import { DmsController } from './dms.controller';
import { DmsService } from './dms.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [DmsController],
  providers: [DmsService],
  exports: [DmsService],
})
export class DmsModule {}

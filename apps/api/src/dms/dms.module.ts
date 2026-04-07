import { Module } from '@nestjs/common';
import { DmsController } from './dms.controller';
import { DmsService } from './dms.service';

@Module({
  controllers: [DmsController],
  providers: [DmsService],
  exports: [DmsService],
})
export class DmsModule {}

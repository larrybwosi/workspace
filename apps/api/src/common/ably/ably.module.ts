import { Module } from '@nestjs/common';
import { AblyController } from './ably.controller';

@Module({
  controllers: [AblyController],
})
export class AblyModule {}

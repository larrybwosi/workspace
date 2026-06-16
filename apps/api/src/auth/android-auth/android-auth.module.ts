import { Module } from '@nestjs/common';
import { AndroidAuthController } from './android-auth.controller';

@Module({
  controllers: [AndroidAuthController],
})
export class AndroidAuthModule {}

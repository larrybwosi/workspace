import { Module } from '@nestjs/common';
import { DeviceAuthController } from './device-auth.controller';

@Module({
  controllers: [DeviceAuthController],
})
export class DeviceAuthModule {}

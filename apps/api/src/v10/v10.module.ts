import { Module } from '@nestjs/common';
import { V10UsersController } from './users.controller';
import { V10GatewayController } from './gateway.controller';
import { ApiV10Guard } from '../auth/api-v10.guard';

@Module({
  controllers: [V10UsersController, V10GatewayController],
  providers: [ApiV10Guard],
})
export class V10Module {}

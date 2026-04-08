import { Module } from '@nestjs/common';
import { V10UsersController } from './users.controller';
import { V10GatewayController } from './gateway.controller';
import { V10ChannelsController } from './channels.controller';
import { V10GuildsController } from './guilds.controller';
import { V10ApplicationsController } from './applications.controller';
import { V10InteractionsController } from './interactions.controller';
import { V10EnterpriseController } from './enterprise.controller';
import { V10ChannelsService } from './channels.service';
import { V10GuildsService } from './guilds.service';
import { V10ApplicationsService } from './applications.service';
import { V10InteractionsService } from './interactions.service';
import { V10EnterpriseService } from './enterprise.service';
import { ApiV10Guard } from '../auth/api-v10.guard';

@Module({
  controllers: [
    V10UsersController,
    V10GatewayController,
    V10ChannelsController,
    V10GuildsController,
    V10ApplicationsController,
    V10InteractionsController,
    V10EnterpriseController,
  ],
  providers: [
    V10ChannelsService,
    V10GuildsService,
    V10ApplicationsService,
    V10InteractionsService,
    V10EnterpriseService,
    ApiV10Guard,
  ],
})
export class V10Module {}

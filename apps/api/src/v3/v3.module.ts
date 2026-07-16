import { Module } from '@nestjs/common';
import { V3OAuthController } from './oauth.controller';
import { V3WorkspacesController } from './v3-workspaces.controller';
import { V3WebhooksController } from './v3-webhooks.controller';
import { V3ChannelIncomingWebhooksController } from './v3-channel-incoming-webhooks.controller';
import { ApiV3Guard } from '../auth/api-v3.guard';
import { ProvisioningService } from '../v2/provisioning.service';
import { PrismaService } from '../prisma.service';
import { V2WebhooksService } from '../v2/v2-webhooks.service';

@Module({
  controllers: [
    V3OAuthController,
    V3WorkspacesController,
    V3WebhooksController,
    V3ChannelIncomingWebhooksController,
  ],
  providers: [
    ApiV3Guard,
    ProvisioningService,
    PrismaService,
    V2WebhooksService,
  ],
  exports: [
    ApiV3Guard,
  ],
})
export class V3Module {}

import { Module } from '@nestjs/common';
import { V3OAuthController } from './oauth.controller';
import { V3WorkspacesController } from './v3-workspaces.controller';
import { ApiV3Guard } from '../auth/api-v3.guard';
import { ProvisioningService } from '../v2/provisioning.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [
    V3OAuthController,
    V3WorkspacesController,
  ],
  providers: [
    ApiV3Guard,
    ProvisioningService,
    PrismaService,
  ],
  exports: [
    ApiV3Guard,
  ],
})
export class V3Module {}

import { Module } from '@nestjs/common';
import { IntegrationsController, WorkspaceIntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [NotificationsModule, CommonModule],
  controllers: [IntegrationsController, WorkspaceIntegrationsController],
  providers: [IntegrationsService],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}

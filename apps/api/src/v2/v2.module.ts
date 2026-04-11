import { Module } from '@nestjs/common';
import { V2WorkspacesController } from './workspaces/workspaces.controller';
import { V2MessagesController } from './workspaces/messages.controller';
import { V2SearchController } from './workspaces/search.controller';
import { V2ApiTokensController } from './workspaces/api-tokens.controller';
import { V2WebhooksController } from './workspaces/webhooks.controller';
import { V2ThreadsController } from './workspaces/threads.controller';
import { V2MessageActionsController } from './workspaces/actions.controller';
import { V2DepartmentsController } from './workspaces/departments.controller';
import { V2TeamsController } from './workspaces/teams.controller';
import { V2AnnouncementsController } from './workspaces/announcements.controller';
import { V2OAuthController } from './oauth.controller';
import { V2ApplicationsController } from './applications.controller';
import { V2ApplicationsService } from './applications.service';
import { V2ContactController } from './contact.controller';
import { ApiV2Guard } from '../auth/api-v2.guard';
import { V2AuditService } from './v2-audit.service';
import { V2WebhooksService } from './v2-webhooks.service';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [IntegrationsModule],
  controllers: [
    V2WorkspacesController,
    V2MessagesController,
    V2SearchController,
    V2ApiTokensController,
    V2WebhooksController,
    V2ThreadsController,
    V2MessageActionsController,
    V2DepartmentsController,
    V2TeamsController,
    V2AnnouncementsController,
    V2OAuthController,
    V2ApplicationsController,
    V2ContactController,
  ],
  providers: [ApiV2Guard, V2AuditService, V2WebhooksService, V2ApplicationsService],
})
export class V2Module {}

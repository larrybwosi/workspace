import { Module } from '@nestjs/common';
import { WorkspacesController } from './workspaces.controller';
import { MembersController } from './members.controller';
import { ChannelsController } from './channels.controller';
import { DepartmentsController } from './departments.controller';
import { TeamsController } from './teams.controller';
import { MessagesController } from './messages.controller';
import { EmojisController } from './emojis.controller';
import { AuditLogsController } from './audit-logs.controller';
import { InviteLinksController } from './invite-links.controller';
import { ApiTokensController } from './api-tokens.controller';
import { WebhooksController } from './webhooks.controller';
import { CallsController } from './calls.controller';
import { MessagesService } from './messages.service';

@Module({
  providers: [MessagesService],
  controllers: [
    WorkspacesController,
    MembersController,
    ChannelsController,
    DepartmentsController,
    TeamsController,
    MessagesController,
    EmojisController,
    AuditLogsController,
    InviteLinksController,
    ApiTokensController,
    WebhooksController,
    CallsController,
  ],
})
export class WorkspacesModule {}

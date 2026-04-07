import { Module } from '@nestjs/common';
import { V2WorkspacesController } from './workspaces/workspaces.controller';
import { V2MessagesController } from './workspaces/messages.controller';
import { ApiV2Guard } from '../auth/api-v2.guard';

@Module({
  controllers: [V2WorkspacesController, V2MessagesController],
  providers: [ApiV2Guard],
})
export class V2Module {}

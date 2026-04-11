import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validateEnv } from '@repo/shared';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersController } from './users/users.controller';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { RedisModule } from './common/redis/redis.module';
import { V2Module } from './v2/v2.module';
import { V10Module } from './v10/v10.module';
import { NotificationsModule } from './notifications/notifications.module';
import { InvitationsModule } from './invitations/invitations.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { CallsModule } from './calls/calls.module';
import { ChannelsModule } from './channels/channels.module';
import { AdminModule } from './admin/admin.module';
import { DmsModule } from './dms/dms.module';
import { FriendsModule } from './friends/friends.module';
import { CommonModule } from './common/common.module';
import { AssetsModule } from './assets/assets.module';
import { MessagesModule } from './messages/messages.module';
import { TasksModule } from './common/tasks/tasks.module';
import { ScheduledNotificationsModule } from './scheduled-notifications/scheduled-notifications.module';
import { DeviceAuthModule } from './auth/device-auth/device-auth.module';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './auth/better-auth';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: config => validateEnv(config),
    }),
    ScheduleModule.forRoot(),
    RedisModule,
    V2Module,
    V10Module,
    NotificationsModule,
    InvitationsModule,
    IntegrationsModule,
    CallsModule,
    ChannelsModule,
    AuthModule.forRoot({ auth }),
    AdminModule,
    DmsModule,
    FriendsModule,
    CommonModule,
    WorkspacesModule,
    MessagesModule,
    TasksModule,
    DeviceAuthModule,
    ScheduledNotificationsModule,
    AssetsModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        return {
          throttlers: [
            {
              ttl: config.get<number>('THROTTLE_TTL', 60000),
              limit: config.get<number>('THROTTLE_LIMIT', 100),
            },
          ],
          storage: redisUrl ? new ThrottlerStorageRedisService(redisUrl) : undefined,
        };
      },
    }),
  ],
  controllers: [AppController, UsersController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

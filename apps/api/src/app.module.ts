import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersController } from './users/users.controller';
import { WorkspacesController } from './workspaces/workspaces.controller';
import { RedisModule } from './common/redis/redis.module';
import { V2Module } from './v2/v2.module';
import { V10Module } from './v10/v10.module';
import { NotificationsModule } from './notifications/notifications.module';
import { InvitationsModule } from './invitations/invitations.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RedisModule,
    V2Module,
    V10Module,
    NotificationsModule,
    InvitationsModule,
    IntegrationsModule,
    CommonModule,
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
  controllers: [AppController, UsersController, WorkspacesController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
        const client = new Redis(redisUrl, {
          lazyConnect: true,
          maxRetriesPerRequest: 0,
          connectTimeout: 5000,
        });

        client.on('error', (error) => {
          console.warn('[Redis] Connection error:', error.message);
        });

        return client;
      },
      inject: [ConfigService],
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}

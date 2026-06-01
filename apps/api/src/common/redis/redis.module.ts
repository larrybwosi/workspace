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
          maxRetriesPerRequest: null,
          connectTimeout: 5000,
          reconnectOnError: (err) => {
            const targetError = 'READONLY';
            if (err.message.includes(targetError)) {
              return true;
            }
            return false;
          },
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          }
        });

        client.on('error', error => {
          // Only log once every 30 seconds to avoid flooding
          const now = Date.now();
          if (!client['lastLogErrorTime'] || now - client['lastLogErrorTime'] > 30000) {
            console.warn('[Redis] Connection error:', error.message);
            client['lastLogErrorTime'] = now;
          }
        });

        return client;
      },
      inject: [ConfigService],
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}

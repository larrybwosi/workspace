import { IoAdapter } from '@nestjs/platform-socket.io';
import { Logger } from '@nestjs/common';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';

export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor: ReturnType<typeof createAdapter>;

  constructor(
    app: any,
    private readonly redisUrl: string
  ) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    const redisOptions = {
      maxRetriesPerRequest: null,
      retryStrategy: (times: number) => Math.min(times * 50, 2000),
    };
    const pubClient = new Redis(this.redisUrl, redisOptions);
    const subClient = new Redis(this.redisUrl, redisOptions);

    pubClient.on('error', (err) => {
      this.logger.warn(`pubClient error: ${err.message}`);
    });
    subClient.on('error', (err) => {
      this.logger.warn(`subClient error: ${err.message}`);
    });

    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }
}

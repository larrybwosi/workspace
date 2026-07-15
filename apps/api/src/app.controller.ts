import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @SkipThrottle()
  @Get('health')
  @ApiOperation({ summary: 'Check health' })
  getHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get()
  @ApiOperation({ summary: 'Hello' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('config/realtime')
  @ApiOperation({ summary: 'Get realtime configuration' })
  getRealtimeConfig() {
    return {
      provider: process.env.REALTIME_PROVIDER || 'ably',
    };
  }
}

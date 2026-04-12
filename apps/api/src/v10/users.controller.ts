import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiV10Guard } from '../auth/api-v10.guard';
import { CurrentBot } from '../auth/current-bot.decorator';

@Controller('bot/v10/users/@me')
@UseGuards(ApiV10Guard)
export class V10UsersController {
  @Get()
  async getMe(@CurrentBot() bot: any) {
    return {
      id: bot.id,
      username: bot.name,
      discriminator: '0000',
      avatar: bot.avatar,
      bot: true,
      system: false,
      mfa_enabled: true,
      locale: 'en-US',
      verified: true,
      email: bot.email,
      flags: 0,
      premium_type: 0,
      public_flags: 0,
    };
  }
}

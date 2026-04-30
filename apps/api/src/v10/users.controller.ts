import { Controller, Get, Param, UseGuards, NotFoundException } from '@nestjs/common';
import { prisma } from '@repo/database';
import { ApiV10Guard } from '../auth/api-v10.guard';
import { CurrentBot } from '../auth/current-bot.decorator';

@Controller('bot/v10/users')
@UseGuards(ApiV10Guard)
export class V10UsersController {
  @Get(':id')
  async getUser(@Param('id') id: string) {
    if (id === '@me') {
        // This is handled by getMe but just in case
        return null;
    }
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) throw new NotFoundException('Unknown User');

    return {
      id: user.id,
      username: user.name,
      discriminator: '0000',
      avatar: user.avatar,
      bot: user.isBot,
      public_flags: 0,
    };
  }

  @Get('@me')
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

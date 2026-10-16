import { Controller, Get, Param, UseGuards, NotFoundException } from '@nestjs/common';
import { prisma } from '@repo/database';
import { ApiV10Guard } from '../auth/api-v10.guard';
import { CurrentBot } from '../auth/current-bot.decorator';

@Controller('bot/v10/users')
@UseGuards(ApiV10Guard)
export class V10UsersController {
  @Get(':id')
  async getUser(@CurrentBot() bot: any, @Param('id') id: string) {
    if (id === '@me' || id === bot.id) {
      return this.getMe(bot);
    }

    /**
     * THREAT MITIGATION: Broken Object Level Authorization (BOLA / IDOR) & User Profile Enumeration
     * Risk Level: High
     * Verify that the requesting bot shares at least one workspace with the target user before
     * exposing user profile details. Prevents unauthorized bots from enumerating and scraping
     * user accounts across external workspaces.
     */
    const sharedWorkspace = await prisma.workspaceMember.findFirst({
      where: {
        userId: id,
        workspace: {
          members: {
            some: { userId: bot.id },
          },
        },
      },
      select: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            isBot: true,
          },
        },
      },
    });

    if (!sharedWorkspace || !sharedWorkspace.user) {
      throw new NotFoundException('Unknown User');
    }

    const user = sharedWorkspace.user;

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

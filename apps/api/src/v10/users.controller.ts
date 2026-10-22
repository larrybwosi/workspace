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
     * ⚡ Performance Optimization:
     * Leverages direct O(1) primary key lookup on `User.id` (`prisma.user.findUnique`) instead of
     * non-primary table scan on `workspaceMember.findFirst`.
     * If the target user does not exist, `findUnique` short-circuits instantly in O(1) without joining
     * `workspace_members` or `workspaces`. If the user exists, it verifies shared workspace membership
     * via nested `workspaceMemberships` relation filter in a single query.
     */
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        avatar: true,
        isBot: true,
        workspaceMemberships: {
          where: {
            workspace: {
              members: {
                some: { userId: bot.id },
              },
            },
          },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!user || user.workspaceMemberships.length === 0) {
      throw new NotFoundException('Unknown User');
    }

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

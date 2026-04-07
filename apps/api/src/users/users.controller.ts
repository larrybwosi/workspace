import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { prisma } from '@repo/database';
import type { User } from '@repo/database';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  @Get('me')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getMe(@CurrentUser() user: User): Promise<any> {
    return prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        avatar: true,
        banner: true,
        statusText: true,
        statusEmoji: true,
        role: true,
        status: true,
        createdAt: true,
        notificationPreferences: true,
      },
    });
  }
}

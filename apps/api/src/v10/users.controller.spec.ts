import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { V10UsersController } from './users.controller';

vi.mock('@repo/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from '@repo/database';

describe('V10UsersController', () => {
  let controller: V10UsersController;

  const mockBot = {
    id: 'bot_101',
    name: 'TestBot',
    email: 'testbot@app.com',
    avatar: 'https://example.com/bot.png',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new V10UsersController();
  });

  describe('getUser', () => {
    it('should return bot profile when requesting @me or bot.id', async () => {
      const resMe = await controller.getUser(mockBot, '@me');
      expect(resMe.id).toBe('bot_101');
      expect(resMe.username).toBe('TestBot');
      expect(resMe.bot).toBe(true);

      const resBotId = await controller.getUser(mockBot, 'bot_101');
      expect(resBotId.id).toBe('bot_101');
    });

    it('should return user details when bot and target user share a workspace', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'usr_202',
        name: 'Jane Doe',
        avatar: 'https://example.com/jane.png',
        isBot: false,
        workspaceMemberships: [{ id: 'wm_1' }],
      });

      const res = await controller.getUser(mockBot, 'usr_202');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'usr_202',
        },
        select: {
          id: true,
          name: true,
          avatar: true,
          isBot: true,
          workspaceMemberships: {
            where: {
              workspace: {
                members: {
                  some: { userId: 'bot_101' },
                },
              },
            },
            select: { id: true },
            take: 1,
          },
        },
      });

      expect(res).toEqual({
        id: 'usr_202',
        username: 'Jane Doe',
        discriminator: '0000',
        avatar: 'https://example.com/jane.png',
        bot: false,
        public_flags: 0,
      });
    });

    it('should throw NotFoundException when bot and target user do not share a workspace', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'usr_unauthorized',
        name: 'John Doe',
        avatar: null,
        isBot: false,
        workspaceMemberships: [],
      });

      await expect(controller.getUser(mockBot, 'usr_unauthorized')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw NotFoundException when target user does not exist', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      await expect(controller.getUser(mockBot, 'non_existent_user')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getMe', () => {
    it('should return bot information', async () => {
      const res = await controller.getMe(mockBot);
      expect(res.id).toBe('bot_101');
      expect(res.username).toBe('TestBot');
      expect(res.email).toBe('testbot@app.com');
      expect(res.bot).toBe(true);
    });
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { V10UsersController } from './users.controller';

vi.mock('@repo/database', () => ({
  prisma: {
    workspaceMember: {
      findFirst: vi.fn(),
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
      (prisma.workspaceMember.findFirst as any).mockResolvedValue({
        user: {
          id: 'usr_202',
          name: 'Jane Doe',
          avatar: 'https://example.com/jane.png',
          isBot: false,
        },
      });

      const res = await controller.getUser(mockBot, 'usr_202');

      expect(prisma.workspaceMember.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'usr_202',
          workspace: {
            members: {
              some: { userId: 'bot_101' },
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
      (prisma.workspaceMember.findFirst as any).mockResolvedValue(null);

      await expect(controller.getUser(mockBot, 'usr_unauthorized')).rejects.toThrow(
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

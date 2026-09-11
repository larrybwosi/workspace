import { Test, TestingModule } from '@nestjs/testing';
import { V3DmsController } from './v3-dms.controller';
import { DmsService } from '../dms/dms.service';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { prisma } from '@repo/database';

describe('V3DmsController', () => {
  let controller: V3DmsController;
  let dmsService: Partial<DmsService>;

  beforeEach(async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({ id: 'usr_1', name: 'User 1' } as any);
    vi.spyOn(prisma.user, 'findFirst').mockResolvedValue({ id: 'bot_1', name: 'Bot 1' } as any);

    dmsService = {
      getDms: vi.fn().mockResolvedValue([{ id: 'dm_1' }]),
      createDm: vi.fn().mockResolvedValue({ id: 'dm_1' }),
      getDm: vi.fn().mockImplementation(async (id: string) => (id === 'dm_1' ? { id: 'dm_1' } : null)),
      deleteDm: vi.fn().mockResolvedValue({ success: true }),
      getMessages: vi.fn().mockResolvedValue({ messages: [], nextCursor: null }),
      createMessage: vi.fn().mockResolvedValue({ id: 'msg_1', content: 'hello' }),
      updateMessage: vi.fn().mockResolvedValue({ id: 'msg_1', content: 'updated' }),
      deleteMessage: vi.fn().mockResolvedValue({ success: true }),
      addReaction: vi.fn().mockResolvedValue({ id: 'react_1', emoji: '👍' }),
      removeReaction: vi.fn().mockResolvedValue({ success: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [V3DmsController],
      providers: [
        { provide: DmsService, useValue: dmsService },
        { provide: 'REDIS_CLIENT', useValue: {} },
        { provide: ConfigService, useValue: { get: vi.fn() } },
      ],
    }).compile();

    controller = module.get<V3DmsController>(V3DmsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDms', () => {
    it('should throw ForbiddenException if missing messages:read scope', async () => {
      const context: any = { scopes: ['channels:read'], userId: 'usr_1' };
      await expect(controller.getDms(context)).rejects.toThrow(ForbiddenException);
    });

    it('should return conversations when authorized', async () => {
      const context: any = { scopes: ['messages:read'], userId: 'usr_1' };
      const res = await controller.getDms(context);
      expect(res.success).toBe(true);
      expect(res.data.conversations).toBeDefined();
    });
  });

  describe('createDm', () => {
    it('should throw ForbiddenException if missing messages:send scope', async () => {
      const context: any = { scopes: ['messages:read'], userId: 'usr_1' };
      await expect(controller.createDm(context, { targetUserId: 'usr_2' })).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if targetUserId is missing', async () => {
      const context: any = { scopes: ['messages:send'], userId: 'usr_1' };
      await expect(controller.createDm(context, {})).rejects.toThrow(BadRequestException);
    });
  });

  describe('getDm', () => {
    it('should return conversation details if found', async () => {
      const context: any = { scopes: ['messages:read'], userId: 'usr_1' };
      const res = await controller.getDm(context, 'dm_1');
      expect(res.success).toBe(true);
      expect(res.data.conversation.id).toBe('dm_1');
    });

    it('should throw NotFoundException if conversation not found', async () => {
      const context: any = { scopes: ['messages:read'], userId: 'usr_1' };
      await expect(controller.getDm(context, 'dm_invalid')).rejects.toThrow(NotFoundException);
    });
  });
});

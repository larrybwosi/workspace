import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { V3DmsController } from './v3-dms.controller';

vi.mock('@repo/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    dMConversation: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    dMMessage: {
      findUnique: vi.fn(),
    },
    messageAction: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
    messageActionResponse: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
    botApplication: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('@repo/shared/server', () => ({
  publishRealtime: vi.fn().mockResolvedValue(true),
  AblyChannels: {
    dm: (id: string) => `dm:${id}`,
  },
}));

import { prisma } from '@repo/database';

describe('V3DmsController Actions', () => {
  let controller: V3DmsController;
  let mockDmsService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDmsService = {
      createMessage: vi.fn().mockResolvedValue({ id: 'msg_1', content: 'hello' }),
      updateMessage: vi.fn().mockResolvedValue({ id: 'msg_1', content: 'updated' }),
      addReaction: vi.fn().mockResolvedValue({ id: 'react_1', emoji: '👍' }),
    };
    controller = new V3DmsController(mockDmsService, {} as any);
  });

  const mockContext = {
    scopes: ['messages:send', 'messages:read'],
    userId: 'usr_1',
  };

  it('should trigger DM message action and record response', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'usr_1', name: 'User 1' });
    const mockMessage = {
      id: 'msg_dm_1',
      conversationId: 'dm_1',
      content: 'Approval required',
      senderId: 'bot_1',
      sender: { isBot: true },
      metadata: {
        customMessage: {
          actions: [{ id: 'approve', label: 'Approve', allowMultipleResponses: false }],
        },
        callbackUrl: 'https://example.com/callback',
      },
    };

    (prisma.dMMessage.findUnique as any).mockResolvedValue(mockMessage);
    (prisma.messageAction.findFirst as any).mockResolvedValue(null);
    (prisma.messageAction.upsert as any).mockResolvedValue({
      id: 'act_db_1',
      messageId: 'msg_dm_1',
      actionId: 'approve',
      label: 'Approve',
    });
    (prisma.messageActionResponse.findFirst as any).mockResolvedValue(null);
    (prisma.messageActionResponse.create as any).mockResolvedValue({
      id: 'resp_1',
      actionId: 'act_db_1',
      messageId: 'msg_dm_1',
      userId: 'usr_1',
      actionValue: 'approve',
      respondedAt: new Date(),
      user: { id: 'usr_1', name: 'User 1', email: 'user1@test.com', avatar: null },
    });

    const result = await controller.triggerDmMessageAction(
      mockContext as any,
      'dm_1',
      'msg_dm_1',
      { actionId: 'approve', comment: 'Looks good' }
    );

    expect(result.success).toBe(true);
    expect(result.data.response.id).toBe('resp_1');
    expect(prisma.messageActionResponse.create).toHaveBeenCalled();
  });

  it('should get DM message action responses', async () => {
    (prisma.messageActionResponse.findMany as any).mockResolvedValue([
      {
        id: 'resp_1',
        actionId: 'act_db_1',
        messageId: 'msg_dm_1',
        userId: 'usr_1',
        actionValue: 'approve',
        respondedAt: new Date(),
        user: { id: 'usr_1', name: 'User 1', email: 'user1@test.com', avatar: null },
      },
    ]);

    const result = await controller.getDmMessageActionResponses(
      mockContext as any,
      'dm_1',
      'msg_dm_1'
    );

    expect(result.success).toBe(true);
    expect(result.data.responses).toHaveLength(1);
    expect(result.data.responses[0].id).toBe('resp_1');
  });

  describe('createMessage', () => {
    it('should throw ForbiddenException if missing messages:send scope', async () => {
      const context: any = { scopes: ['messages:read'], userId: 'usr_1' };
      await expect(controller.createMessage(context, 'dm_1', { content: 'hello' })).rejects.toThrow(ForbiddenException);
    });

    it('should create message with valid DTO payload', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({ id: 'usr_1', name: 'User 1' });
      const context: any = { scopes: ['messages:send'], userId: 'usr_1' };
      const dto = {
        content: 'hello',
        replyToId: 'msg_0',
        attachments: [{ name: 'test.png', type: 'image/png', url: 'https://example.com/test.png', size: 100 }],
      };
      const res = await controller.createMessage(context, 'dm_1', dto);
      expect(res.success).toBe(true);
      expect(mockDmsService.createMessage).toHaveBeenCalledWith('dm_1', 'usr_1', dto);
    });
  });

  describe('updateMessage', () => {
    it('should update message with valid DTO payload', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({ id: 'usr_1', name: 'User 1' });
      const context: any = { scopes: ['messages:send'], userId: 'usr_1' };
      const res = await controller.updateMessage(context, 'dm_1', 'msg_1', { content: 'updated' });
      expect(res.success).toBe(true);
      expect(mockDmsService.updateMessage).toHaveBeenCalledWith('dm_1', 'msg_1', 'usr_1', 'updated');
    });
  });

  describe('addReaction', () => {
    it('should add reaction with valid DTO payload', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({ id: 'usr_1', name: 'User 1' });
      const context: any = { scopes: ['messages:send'], userId: 'usr_1' };
      const res = await controller.addReaction(context, 'dm_1', 'msg_1', { emoji: '👍' });
      expect(res.success).toBe(true);
      expect(mockDmsService.addReaction).toHaveBeenCalledWith('dm_1', 'msg_1', 'usr_1', '👍');
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { MessagesService } from './messages.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { prisma } from '@repo/database';
import * as sharedServer from '@repo/shared/server';
import { vi, describe, beforeEach, it, expect } from 'vitest';

vi.mock('@repo/database', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    channel: {
      findUnique: vi.fn(),
    },
    message: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    messageActionResponse: {
      findUnique: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    workspaceAuditLog: {
      create: vi.fn(),
    },
    workspace: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((args) => Promise.all(args)),
  },
}));

vi.mock('@repo/shared/server', () => ({
  AblyChannels: {
    channel: vi.fn((id) => `channel:${id}`),
    workspace: vi.fn((id) => `workspace:${id}`),
    user: vi.fn((id) => `user:${id}`),
  },
  AblyEvents: {
    MESSAGE_SENT: 'message:sent',
    MESSAGE_UPDATED: 'message:updated',
  },
  publishRealtime: vi.fn().mockResolvedValue(undefined),
  notifyMentions: vi.fn().mockResolvedValue(undefined),
  notifyChannel: vi.fn().mockResolvedValue(undefined),
  notifyNewMessage: vi.fn().mockResolvedValue(undefined),
  notifyReply: vi.fn().mockResolvedValue(undefined),
  extractUserMentions: vi.fn().mockReturnValue([]),
  extractChannelMentions: vi.fn().mockReturnValue([]),
  hasSpecialMention: vi.fn().mockReturnValue(false),
  extractUserIds: vi.fn().mockReturnValue([]),
}));

describe('MessagesService', () => {
  let service: MessagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: WebhooksService,
          useValue: { dispatch: vi.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
  });

  it('should call publishRealtime when creating a message', async () => {
    (prisma.channel.findUnique as any).mockResolvedValue({
      id: 'chan-1',
      isPrivate: false,
      type: 'public',
      members: [],
    });
    const mockMessage = { id: 'msg-1', channelId: 'chan-1', user: { name: 'Test' } };
    (prisma.message.create as any).mockResolvedValue(mockMessage);
    (prisma.user.update as any).mockResolvedValue({});

    await service.createMessage('user-1', { channelId: 'chan-1', content: 'hello' });

    expect(sharedServer.publishRealtime).toHaveBeenCalledWith(
      'channel:chan-1',
      'message:sent',
      mockMessage
    );
  });

  it('should allow sending a message to a private channel if user is a member of that channel', async () => {
    (prisma.channel.findUnique as any).mockResolvedValue({
      id: 'chan-2',
      workspaceId: 'ws-1',
      isPrivate: true,
      type: 'private',
      members: [{ userId: 'user-1' }],
    });
    const mockMessage = { id: 'msg-2', channelId: 'chan-2', user: { name: 'Test' } };
    (prisma.message.create as any).mockResolvedValue(mockMessage);
    (prisma.user.update as any).mockResolvedValue({});

    const result = await service.createMessage('user-1', { channelId: 'chan-2', content: 'private hello' }, 'ws-1');
    expect(result).toEqual(mockMessage);
  });

  it('should throw ForbiddenException when sending a message to a private channel if user is not a member', async () => {
    (prisma.channel.findUnique as any).mockResolvedValue({
      id: 'chan-2',
      workspaceId: 'ws-1',
      isPrivate: true,
      type: 'private',
      members: [],
    });

    await expect(
      service.createMessage('user-1', { channelId: 'chan-2', content: 'hack' }, 'ws-1')
    ).rejects.toThrow('You do not have permission to access this private channel');
  });

  describe('verifyChannelAccess', () => {
    it('should throw NotFoundException if channel does not exist', async () => {
      (prisma.channel.findUnique as any).mockResolvedValue(null);

      await expect(service.verifyChannelAccess('non-existent', 'user-1', 'ws-1')).rejects.toThrow('Channel not found');
    });

    it('should throw NotFoundException if channel does not belong to the requested workspace', async () => {
      (prisma.channel.findUnique as any).mockResolvedValue({
        id: 'chan-1',
        workspaceId: 'ws-other',
        isPrivate: false,
        members: [],
      });

      await expect(service.verifyChannelAccess('chan-1', 'user-1', 'ws-1')).rejects.toThrow(
        'Channel not found in this workspace'
      );
    });

    it('should throw ForbiddenException if channel is private and user is not a member', async () => {
      (prisma.channel.findUnique as any).mockResolvedValue({
        id: 'chan-1',
        workspaceId: 'ws-1',
        isPrivate: true,
        type: 'private',
        members: [],
      });

      await expect(service.verifyChannelAccess('chan-1', 'user-1', 'ws-1')).rejects.toThrow(
        'You do not have permission to access this private channel'
      );
    });

    it('should return channel when user has access', async () => {
      const mockChannel = {
        id: 'chan-1',
        workspaceId: 'ws-1',
        isPrivate: false,
        type: 'public',
        members: [],
      };
      (prisma.channel.findUnique as any).mockResolvedValue(mockChannel);

      const result = await service.verifyChannelAccess('chan-1', 'user-1', 'ws-1');
      expect(result).toEqual(mockChannel);
    });
  });

  describe('processActionResponse', () => {
    it('should process action response and trigger webhooks', async () => {
      const mockMessage = {
        id: 'msg-100',
        channelId: 'chan-1',
        content: 'Approval required',
        actions: [{ id: 'action-db-1', actionId: 'approve', label: 'Approve' }],
        metadata: { callbackUrl: 'https://example.com/callback' },
        channel: {
          id: 'chan-1',
          workspace: { id: 'ws-1', name: 'Acme' },
        },
      };

      (prisma.channel.findUnique as any).mockResolvedValue({
        id: 'chan-1',
        workspaceId: 'ws-1',
        isPrivate: false,
        members: [],
      });

      const mockResponse = {
        id: 'resp-1',
        actionId: 'action-db-1',
        messageId: 'msg-100',
        userId: 'user-1',
        actionValue: 'approve',
        respondedAt: new Date(),
        user: { id: 'user-1', name: 'Alice', email: 'alice@example.com', avatar: null },
        action: { id: 'action-db-1', actionId: 'approve', label: 'Approve' },
      };

      (prisma.message.findUnique as any).mockResolvedValue(mockMessage);
      (prisma.messageActionResponse.findUnique as any).mockResolvedValue(null);
      (prisma.messageActionResponse.create as any).mockResolvedValue(mockResponse);
      (prisma.workspaceAuditLog.create as any).mockResolvedValue({});

      const result = await service.processActionResponse('user-1', 'msg-100', {
        actionId: 'approve',
        comment: 'LGTM',
      });

      expect(result.success).toBe(true);
      expect(result.response).toEqual(mockResponse);
    });

    it('should throw NotFoundException if message is not found', async () => {
      (prisma.message.findUnique as any).mockResolvedValue(null);

      await expect(
        service.processActionResponse('user-1', 'invalid-msg', { actionId: 'approve' })
      ).rejects.toThrow('Message not found');
    });

    it('should throw BadRequestException if action was already responded', async () => {
      const mockMessage = {
        id: 'msg-100',
        channelId: 'chan-1',
        actions: [{ id: 'action-db-1', actionId: 'approve', label: 'Approve' }],
        channel: { id: 'chan-1', workspace: { id: 'ws-1' } },
      };

      (prisma.channel.findUnique as any).mockResolvedValue({
        id: 'chan-1',
        workspaceId: 'ws-1',
        isPrivate: false,
        members: [],
      });

      (prisma.message.findUnique as any).mockResolvedValue(mockMessage);
      (prisma.messageActionResponse.findUnique as any).mockResolvedValue({ id: 'resp-existing' });

      await expect(
        service.processActionResponse('user-1', 'msg-100', { actionId: 'approve' })
      ).rejects.toThrow('Action already responded');
    });
  });

  describe('updateMessage', () => {
    it('should update message successfully when user is author and channel matches', async () => {
      (prisma.channel.findUnique as any).mockResolvedValue({
        id: 'chan-1',
        workspaceId: 'ws-1',
        isPrivate: false,
        members: [],
      });

      const existingMessage = { id: 'msg-1', channelId: 'chan-1', userId: 'user-1', content: 'Old' };
      const updatedMessage = { ...existingMessage, content: 'New', isEdited: true };

      (prisma.message.findUnique as any).mockResolvedValue(existingMessage);
      (prisma.message.update as any).mockResolvedValue(updatedMessage);

      const result = await service.updateMessage('user-1', 'msg-1', 'New', 'chan-1', 'ws-1');
      expect(result).toEqual(updatedMessage);
    });

    it('should throw NotFoundException when message does not belong to target channel', async () => {
      (prisma.channel.findUnique as any).mockResolvedValue({
        id: 'chan-1',
        workspaceId: 'ws-1',
        isPrivate: false,
        members: [],
      });

      const existingMessage = { id: 'msg-1', channelId: 'chan-other', userId: 'user-1', content: 'Old' };
      (prisma.message.findUnique as any).mockResolvedValue(existingMessage);

      await expect(
        service.updateMessage('user-1', 'msg-1', 'New', 'chan-1', 'ws-1')
      ).rejects.toThrow('Message not found in this channel');
    });

    it('should throw ForbiddenException when updating another user message', async () => {
      (prisma.channel.findUnique as any).mockResolvedValue({
        id: 'chan-1',
        workspaceId: 'ws-1',
        isPrivate: false,
        members: [],
      });

      const existingMessage = { id: 'msg-1', channelId: 'chan-1', userId: 'user-author', content: 'Old' };
      (prisma.message.findUnique as any).mockResolvedValue(existingMessage);

      await expect(
        service.updateMessage('user-attacker', 'msg-1', 'Hacked', 'chan-1', 'ws-1')
      ).rejects.toThrow('You can only update your own messages');
    });

    it('should throw ForbiddenException when user is not a member of private channel', async () => {
      (prisma.channel.findUnique as any).mockResolvedValue({
        id: 'chan-private',
        workspaceId: 'ws-1',
        isPrivate: true,
        type: 'private',
        members: [],
      });

      await expect(
        service.updateMessage('user-1', 'msg-1', 'New', 'chan-private', 'ws-1')
      ).rejects.toThrow('You do not have permission to access this private channel');
    });
  });

  describe('deleteMessage', () => {
    it('should delete message successfully when user is author and channel matches', async () => {
      (prisma.channel.findUnique as any).mockResolvedValue({
        id: 'chan-1',
        workspaceId: 'ws-1',
        isPrivate: false,
        members: [],
      });

      const existingMessage = {
        id: 'msg-1',
        channelId: 'chan-1',
        userId: 'user-1',
        rootThread: null,
        _count: { replies: 0 },
      };

      (prisma.message.findUnique as any).mockResolvedValue(existingMessage);
      (prisma.message.delete as any).mockResolvedValue(existingMessage);

      const result = await service.deleteMessage('user-1', 'msg-1', 'chan-1', 'ws-1');
      expect(result).toEqual({ success: true });
    });

    it('should throw NotFoundException when message does not belong to target channel on delete', async () => {
      (prisma.channel.findUnique as any).mockResolvedValue({
        id: 'chan-1',
        workspaceId: 'ws-1',
        isPrivate: false,
        members: [],
      });

      const existingMessage = { id: 'msg-1', channelId: 'chan-other', userId: 'user-1' };
      (prisma.message.findUnique as any).mockResolvedValue(existingMessage);

      await expect(
        service.deleteMessage('user-1', 'msg-1', 'chan-1', 'ws-1')
      ).rejects.toThrow('Message not found in this channel');
    });

    it('should throw ForbiddenException when deleting another user message', async () => {
      (prisma.channel.findUnique as any).mockResolvedValue({
        id: 'chan-1',
        workspaceId: 'ws-1',
        isPrivate: false,
        members: [],
      });

      const existingMessage = { id: 'msg-1', channelId: 'chan-1', userId: 'user-author' };
      (prisma.message.findUnique as any).mockResolvedValue(existingMessage);

      await expect(
        service.deleteMessage('user-attacker', 'msg-1', 'chan-1', 'ws-1')
      ).rejects.toThrow('You can only delete your own messages');
    });
  });
});

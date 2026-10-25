import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ChannelsController, CreateChannelDto } from './channels.controller';
import { ChannelsService } from './channels.service';
import { AdminGuard } from '../auth/admin.guard';
import { AuthGuard } from '../auth/auth.guard';

describe('ChannelsController', () => {
  let controller: ChannelsController;
  let channelsService: any;

  const mockUser: any = { id: 'user-1', name: 'Test User', email: 'test@example.com' };

  beforeEach(async () => {
    channelsService = {
      getGlobalChannels: vi.fn().mockResolvedValue([{ id: 'ch-1', name: 'general' }]),
      createChannel: vi.fn().mockImplementation(async (dto) => ({ id: 'ch-new', ...dto })),
      getMessages: vi.fn().mockResolvedValue({ messages: [], nextCursor: null, hasMore: false }),
      createMessage: vi.fn().mockResolvedValue({ id: 'msg-1', content: 'hello' }),
      updateMessage: vi.fn().mockResolvedValue({ id: 'msg-1', content: 'updated' }),
      deleteMessage: vi.fn().mockResolvedValue({ success: true }),
      markAsRead: vi.fn().mockResolvedValue({ success: true }),
      addReaction: vi.fn().mockResolvedValue({ id: 'r-1', emoji: '👍' }),
      removeReaction: vi.fn().mockResolvedValue({ success: true }),
      inviteWorkspaceToChannel: vi.fn().mockResolvedValue({ id: 'sc-1' }),
      createReply: vi.fn().mockResolvedValue({ id: 'reply-1', content: 'reply' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChannelsController],
      providers: [
        {
          provide: ChannelsService,
          useValue: channelsService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ChannelsController>(ChannelsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getGlobalChannels', () => {
    it('should delegate to channelsService.getGlobalChannels', async () => {
      const res = await controller.getGlobalChannels();
      expect(res).toEqual([{ id: 'ch-1', name: 'general' }]);
      expect(channelsService.getGlobalChannels).toHaveBeenCalled();
    });
  });

  describe('createChannel', () => {
    it('should delegate global channel creation to channelsService.createChannel', async () => {
      const dto: CreateChannelDto = {
        name: 'announcements',
        icon: '#',
        description: 'System announcements',
        isPrivate: false,
      };

      const res = await controller.createChannel(dto);
      expect(res).toEqual({ id: 'ch-new', ...dto });
      expect(channelsService.createChannel).toHaveBeenCalledWith(dto);
    });
  });

  describe('message routes', () => {
    it('should delegate getMessages to service passing channelId and userId', async () => {
      await controller.getMessages('ch-1', mockUser, undefined, '25');
      expect(channelsService.getMessages).toHaveBeenCalledWith('ch-1', 'user-1', undefined, 25);
    });

    it('should delegate createMessage to service', async () => {
      const body = { content: 'hello' };
      await controller.createMessage('ch-1', mockUser, body);
      expect(channelsService.createMessage).toHaveBeenCalledWith('ch-1', 'user-1', body);
    });

    it('should delegate updateMessage to service', async () => {
      await controller.updateMessage('ch-1', 'msg-1', mockUser, { content: 'updated' });
      expect(channelsService.updateMessage).toHaveBeenCalledWith('ch-1', 'msg-1', 'user-1', 'updated');
    });

    it('should delegate deleteMessage to service forwarding userId', async () => {
      await controller.deleteMessage('ch-1', 'msg-1', mockUser);
      expect(channelsService.deleteMessage).toHaveBeenCalledWith('ch-1', 'msg-1', 'user-1');
    });

    it('should delegate markAsRead to service', async () => {
      await controller.markAsRead('ch-1', mockUser, { messageIds: ['msg-1'] });
      expect(channelsService.markAsRead).toHaveBeenCalledWith('user-1', ['msg-1'], 'ch-1');
    });

    it('should delegate addReaction to service', async () => {
      await controller.addReaction('ch-1', 'msg-1', mockUser, { emoji: '👍' });
      expect(channelsService.addReaction).toHaveBeenCalledWith('ch-1', 'msg-1', 'user-1', '👍');
    });

    it('should delegate removeReaction to service', async () => {
      await controller.removeReaction('ch-1', 'msg-1', '👍', mockUser);
      expect(channelsService.removeReaction).toHaveBeenCalledWith('ch-1', 'msg-1', 'user-1', '👍');
    });

    it('should delegate shareChannel to service passing userId', async () => {
      await controller.shareChannel('ch-1', mockUser, 'ws-2');
      expect(channelsService.inviteWorkspaceToChannel).toHaveBeenCalledWith('ch-1', 'ws-2', 'user-1');
    });

    it('should delegate createReply to service', async () => {
      const body = { content: 'reply' };
      await controller.createReply('ch-1', 'msg-1', mockUser, body);
      expect(channelsService.createReply).toHaveBeenCalledWith('ch-1', 'msg-1', 'user-1', body);
    });
  });
});

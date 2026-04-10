import { Test, TestingModule } from '@nestjs/testing';
import { AblyController } from './ably.controller';
import { AuthGuard } from '../../auth/auth.guard';
import { ConfigService } from '@nestjs/config';

describe('AblyController', () => {
  let controller: AblyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AblyController],
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('mock_key'),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AblyController>(AblyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getToken', () => {
    it('should generate a token request with granular capabilities', async () => {
      const mockUser = { id: 'user_123' } as any;

      // Mock getAblyRest
      const mockCreateTokenRequest = jest.fn().mockResolvedValue({ keyName: 'mock.key' });
      const shared = require('@repo/shared');
      jest.spyOn(shared, 'getAblyRest').mockReturnValue({
        auth: {
          createTokenRequest: mockCreateTokenRequest,
        },
      });

      await controller.getToken(mockUser);

      expect(mockCreateTokenRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          clientId: 'user_123',
          capability: expect.objectContaining({
            'user:user_123:*': ['subscribe', 'publish', 'history', 'presence'],
            'notifications:user_123:*': ['subscribe', 'publish', 'history', 'presence'],
          }),
        })
      );
    });
  });
});

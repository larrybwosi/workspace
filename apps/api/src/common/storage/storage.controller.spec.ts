import { Test, TestingModule } from '@nestjs/testing';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';
import { AuthGuard } from '../../auth/auth.guard';
import { vi, describe, beforeEach, it, expect } from 'vitest';

describe('StorageController', () => {
  let controller: StorageController;
  let service: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StorageController],
      providers: [
        {
          provide: StorageService,
          useValue: { uploadFile: vi.fn().mockResolvedValue({ url: 'http://test.com/file.png' }) },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<StorageController>(StorageController);
    service = module.get<StorageService>(StorageService);
  });

  it('should call storageService.uploadFile', async () => {
    const mockFile = {
      toBuffer: vi.fn().mockResolvedValue(Buffer.from('test')),
      filename: 'test.png',
      mimetype: 'image/png',
    };
    const req: any = {
      file: vi.fn().mockResolvedValue(mockFile),
    };

    const result = await controller.uploadFile(req);

    expect(service.uploadFile).toHaveBeenCalled();
    expect(result.url).toBe('http://test.com/file.png');
  });
});

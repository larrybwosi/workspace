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

  it('should call storageService.uploadFile for valid file', async () => {
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

  it('should throw BadRequestException when disallowed MIME type is uploaded', async () => {
    const mockFile = {
      toBuffer: vi.fn().mockResolvedValue(Buffer.from('<html><script>alert(1)</script></html>')),
      filename: 'exploit.html',
      mimetype: 'text/html',
    };
    const req: any = {
      file: vi.fn().mockResolvedValue(mockFile),
    };

    await expect(controller.uploadFile(req)).rejects.toThrow(
      "File upload rejected: MIME type 'text/html' is not permitted."
    );
  });

  it('should throw BadRequestException when file size exceeds 25MB limit', async () => {
    const oversizedBuffer = Buffer.alloc(25 * 1024 * 1024 + 1);
    const mockFile = {
      toBuffer: vi.fn().mockResolvedValue(oversizedBuffer),
      filename: 'huge.zip',
      mimetype: 'application/zip',
    };
    const req: any = {
      file: vi.fn().mockResolvedValue(mockFile),
    };

    await expect(controller.uploadFile(req)).rejects.toThrow(
      'File upload rejected: Exceeds maximum allowed size of 25MB.'
    );
  });
});

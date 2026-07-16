import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import { RustFSStorageProvider } from './providers/rustfs.provider';
import { SanityStorageProvider } from './providers/sanity.provider';
import { vi, describe, beforeEach, it, expect } from 'vitest';

vi.mock('@repo/shared', () => ({
  validateEnv: () => ({
    STORAGE_PROVIDER: 'rustfs',
  }),
}));

describe('StorageService', () => {
  let service: StorageService;
  let rustfsProvider: RustFSStorageProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: RustFSStorageProvider,
          useValue: { uploadFile: vi.fn().mockResolvedValue({ url: 'http://rustfs/file.png' }) },
        },
        {
          provide: SanityStorageProvider,
          useValue: { uploadFile: vi.fn() },
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
    rustfsProvider = module.get<RustFSStorageProvider>(RustFSStorageProvider);
  });

  it('should call rustfsProvider when STORAGE_PROVIDER is rustfs', async () => {
    const file: any = { buffer: Buffer.from('test'), originalname: 'test.png', mimetype: 'image/png', size: 4 };
    const result = await service.uploadFile(file);

    expect(rustfsProvider.uploadFile).toHaveBeenCalledWith(file);
    expect(result.url).toBe('http://rustfs/file.png');
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import { MinioStorageProvider } from './providers/minio.provider';
import { SanityStorageProvider } from './providers/sanity.provider';
import { vi, describe, beforeEach, it, expect } from 'vitest';

vi.mock('@repo/shared', () => ({
  validateEnv: () => ({
    STORAGE_PROVIDER: 'minio',
  }),
}));

describe('StorageService', () => {
  let service: StorageService;
  let minioProvider: MinioStorageProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: MinioStorageProvider,
          useValue: { uploadFile: vi.fn().mockResolvedValue({ url: 'http://minio/file.png' }) },
        },
        {
          provide: SanityStorageProvider,
          useValue: { uploadFile: vi.fn() },
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
    minioProvider = module.get<MinioStorageProvider>(MinioStorageProvider);
  });

  it('should call minioProvider when STORAGE_PROVIDER is minio', async () => {
    const file: any = { buffer: Buffer.from('test'), originalname: 'test.png', mimetype: 'image/png', size: 4 };
    const result = await service.uploadFile(file);

    expect(minioProvider.uploadFile).toHaveBeenCalledWith(file);
    expect(result.url).toBe('http://minio/file.png');
  });
});

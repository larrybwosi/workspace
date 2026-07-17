import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import { RustFSStorageProvider } from './providers/rustfs.provider';
import { SanityStorageProvider } from './providers/sanity.provider';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { prisma } from '@repo/database';

vi.mock('@repo/shared', () => ({
  validateEnv: () => ({
    STORAGE_PROVIDER: 'rustfs',
  }),
}));

vi.mock('@repo/database', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    prisma: {
      shortUrl: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    },
  };
});

describe('StorageService', () => {
  let service: StorageService;
  let rustfsProvider: RustFSStorageProvider;
  let mockRedis: any;

  beforeEach(async () => {
    mockRedis = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue('OK'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: RustFSStorageProvider,
          useValue: { uploadFile: vi.fn().mockResolvedValue({ url: 'http://rustfs/file.png', id: 'file.png', type: 'image/png' }) },
        },
        {
          provide: SanityStorageProvider,
          useValue: { uploadFile: vi.fn() },
        },
        {
          provide: 'REDIS_CLIENT',
          useValue: mockRedis,
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
    rustfsProvider = module.get<RustFSStorageProvider>(RustFSStorageProvider);
  });

  it('should call rustfsProvider, save mapping in database & Redis, and return short proxied URL', async () => {
    vi.mocked(prisma.shortUrl.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.shortUrl.create).mockResolvedValue({ id: 'some-id' } as any);

    const file: any = { buffer: Buffer.from('test'), originalname: 'test.png', mimetype: 'image/png', size: 4 };
    const result = await service.uploadFile(file);

    expect(rustfsProvider.uploadFile).toHaveBeenCalledWith(file);
    expect(prisma.shortUrl.create).toHaveBeenCalled();
    expect(mockRedis.set).toHaveBeenCalled();
    expect(result.url).toContain('/s/');
  });
});

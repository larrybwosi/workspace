import { Test, TestingModule } from '@nestjs/testing';
import { ShortUrlController } from './short-url.controller';
import { RustFSStorageProvider } from './providers/rustfs.provider';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { prisma } from '@repo/database';
import { NotFoundException } from '@nestjs/common';

// Mock the prisma export
vi.mock('@repo/database', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    prisma: {
      shortUrl: {
        findUnique: vi.fn(),
      },
    },
  };
});

describe('ShortUrlController', () => {
  let controller: ShortUrlController;
  let rustfsProvider: RustFSStorageProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShortUrlController],
      providers: [
        {
          provide: RustFSStorageProvider,
          useValue: {
            getPresignedUrl: vi.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ShortUrlController>(ShortUrlController);
    rustfsProvider = module.get<RustFSStorageProvider>(RustFSStorageProvider);
  });

  it('should redirect to original URL if key is missing', async () => {
    const mockShortUrl = {
      id: '1',
      code: 'abc',
      original: 'https://fallback.url',
      key: null,
      mimeType: 'image/png',
    };

    vi.mocked(prisma.shortUrl.findUnique).mockResolvedValue(mockShortUrl as any);

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      redirect: vi.fn(),
    } as any;

    await controller.redirect('abc', mockRes);

    expect(prisma.shortUrl.findUnique).toHaveBeenCalledWith({ where: { code: 'abc' } });
    expect(mockRes.status).toHaveBeenCalledWith(302);
    expect(mockRes.redirect).toHaveBeenCalledWith('https://fallback.url');
  });

  it('should redirect to newly signed URL if key is present', async () => {
    const mockShortUrl = {
      id: '1',
      code: 'def',
      original: 'https://fallback.url',
      key: 'test-file-key.png',
      mimeType: 'image/png',
    };

    vi.mocked(prisma.shortUrl.findUnique).mockResolvedValue(mockShortUrl as any);
    vi.spyOn(rustfsProvider, 'getPresignedUrl').mockResolvedValue('https://signed.url');

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      redirect: vi.fn(),
    } as any;

    await controller.redirect('def', mockRes);

    expect(prisma.shortUrl.findUnique).toHaveBeenCalledWith({ where: { code: 'def' } });
    expect(rustfsProvider.getPresignedUrl).toHaveBeenCalledWith('test-file-key.png');
    expect(mockRes.status).toHaveBeenCalledWith(302);
    expect(mockRes.redirect).toHaveBeenCalledWith('https://signed.url');
  });

  it('should throw NotFoundException if short URL is not found', async () => {
    vi.mocked(prisma.shortUrl.findUnique).mockResolvedValue(null);

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      redirect: vi.fn(),
    } as any;

    await expect(controller.redirect('xyz', mockRes)).rejects.toThrow(NotFoundException);
  });
});
